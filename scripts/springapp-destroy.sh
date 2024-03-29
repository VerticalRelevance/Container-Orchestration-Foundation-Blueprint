eksctl delete iamserviceaccount --config-file=./tmp/service_account.yaml --approve

export ARGO_SVC=$(kubectl get svc -n argocd -l app.kubernetes.io/name=argocd-server -o name)
export ARGO_PWD=`kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`
argocd login localhost:8080 --username admin --password $ARGO_PWD --insecure
argocd app delete polling-app --yes
echo "Deleted polling-app"
