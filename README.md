# Container-Orchestration-Foundation-Blueprint
![image](https://github.com/VerticalRelevance/Container-Orchestration-Foundation-Blueprint/blob/main/Container_Orchestration.drawio.png)

## Install and run CDK
`make`

### Setup Argo Proxy
`make argo-proxy`
This will not complete and should be left open. Use another terminal while this is running to finish dashboard and app installation.

### Install Dashboard and Apps
With argo-proxy running:
```
make dashboard
make spring-apps
```

### argocd UI
localhost:8080
username: admin
password: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

### Cleanup 
`make destroy`
