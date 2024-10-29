"""infra.py

This file is used to customize the infrastructure your application deploys to.

Create your cloud infrastructure with:
    lf create

Deploy your application with:
    lf deploy

"""

import launchflow as lf

# Cloud Run Docs: https://docs.launchflow.com/reference/gcp-services/cloud-run
api = lf.gcp.CloudRunService(
    "launchflow-remix-app",
    dockerfile="Dockerfile",  # Path to your Dockerfile
)
