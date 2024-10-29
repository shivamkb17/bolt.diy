import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import JSZip from 'jszip';
import { initializeAuth } from '~/auth/auth.server';

// Updated action function to include rate limiting
export async function action(args: ActionFunctionArgs) {
  const { context, request } = args;

  const auth = initializeAuth(context.cloudflare.env);
  const userWithToken = await auth.getUserWithAccessToken(request, context);

  if (userWithToken.user === undefined) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();

  const deployment_name = formData.get('deployment_name');
  const zip_file = formData.get('zip_file');
  const account_id = formData.get('account_id')?.toString();
  if (!account_id) {
    return json({ success: false, error: 'account_id is required' }, { status: 400 });
  }
  // delete the account_id from the form data
  formData.delete('account_id');

  // add the handler info
  formData.append('handler', 'handler.handler');

  if (zip_file && zip_file instanceof File) {
    const zipBuffer = await zip_file.arrayBuffer();
    const jszip = new JSZip();

    try {
      const zip = await jszip.loadAsync(zipBuffer);
      const zipContents: any[] = [];

      let requirementsContent = 'mangum\n'; // Start with "mangum\n"

      // Parse the zip file contents
      zip.forEach((relativePath, file) => {
        zipContents.push(relativePath);
      });

      // Read requirements.txt if it exists in the zip file
      const requirementsFile = zip.file('/requirements.txt');
      if (requirementsFile) {
        const requirementsText = await requirementsFile.async('string');
        requirementsContent += requirementsText; // Append the original requirements
      }

      // Update the zip file with the new requirements.txt
      zip.file('requirements.txt', requirementsContent);

      // Add the requirements content to the form data
      formData.append('requirements_txt_file', requirementsContent);

      // Add the handler.py file
      const handlerPyContent = `
import mangum
from main import app

handler = mangum.Mangum(app)
`;
      zip.file('handler.py', handlerPyContent);

      // Convert the updated zip back to a Blob
      const updatedZipBlob = await zip.generateAsync({ type: 'blob' });

      // Replace the original zip_file in formData with the updated zip
      formData.set('zip_file', new File([updatedZipBlob], zip_file.name, { type: zip_file.type }));
    } catch (error) {
      console.error('Failed to read zip file:', error);
      return json({ success: false, error: 'Failed to process zip file' }, { status: 500 });
    }
  } else {
    return json({ success: false, error: 'No zip file provided or invalid format' }, { status: 400 });
  }

  // forwards to this url
  const url = `https://cloud.launchflow.com/v1/deployments?account_id=${encodeURIComponent(account_id)}`;

  // print the body of the form data in raw format

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${userWithToken.accessToken}`,
    },
  });

  // print the response body in raw format (its ReadableStream<Uint8Array>)

  if (response.status !== 200) {
    return json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }

  const reader = response.body?.getReader();

  if (!reader) {
    return json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }

  // read from the buffer until the service is deployed
  const decoder = new TextDecoder();
  let done = false;
  let serviceUrl = '';
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n');
    while (boundary !== -1) {
      const part = buffer.substring(0, boundary);
      buffer = buffer.substring(boundary + 1);
      const jsonContent = JSON.parse(part);
      if (jsonContent.status === 'SUCCEEDED') {
        serviceUrl = jsonContent.service_url;
        break;
      } else if (jsonContent.status === 'FAILURE') {
        return json({ success: false, error: 'json status failed' }, { status: 500 });
      }
      boundary = buffer.indexOf('\n');
    }
  }
  if (!serviceUrl) {
    return json({ success: false, error: 'service url was empty' }, { status: 500 });
  }
  return json({ serviceUrl });
}
