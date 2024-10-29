import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { initializeAuth } from '../auth/auth.server';

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const auth = initializeAuth(context.cloudflare.env);
  return await auth.routes.loader(request, params);
}

export default function Auth() {
  return null;
}

export async function action({ request, params, context }: LoaderFunctionArgs) {
  const auth = initializeAuth(context.cloudflare.env);
  return await auth.routes.action(request, params);
}
