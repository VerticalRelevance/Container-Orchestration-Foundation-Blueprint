#!/bin/bash
CDK_PATH  := $(CURDIR)/blueprint
APP_PATH  := $(CURDIR)/apps
ARGO_PASSWD  :=`kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`
export AWS_ACCOUNT := $(shell aws sts get-caller-identity --query Account --output text)
export AWS_REGION := $(shell aws configure get region)


# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd git-remote-codecommit eksctl kubernetes-cli

all: bootstrap build
	
build:
	make deploy
	aws eks update-kubeconfig --name blueprint --region $(AWS_REGION)
	./scripts/karpenter_provisioner.sh
	rm -rf $(APP_PATH)/spring-frontend/.git $(APP_PATH)/spring-backend/.git  $(CURDIR)/charts/.git
	cd $(CURDIR)/charts/ && git init && git add . && git commit -m 'inital commit' && git remote add origin codecommit::$(AWS_REGION)://blueprint-apps && git push -f --set-upstream origin main
	cd $(APP_PATH)/spring-frontend && git init && git add . && git commit -m 'inital commit' && git remote add origin codecommit::$(AWS_REGION)://spring-frontend && git push -f --set-upstream origin main
	cd $(APP_PATH)/spring-backend && git init && git add . && git commit -am 'inital commit' && git remote add origin codecommit::$(AWS_REGION)://spring-backend && git push -f --set-upstream origin main

argo-proxy:
	echo "argo admin password: "$(ARGO_PASSWD)
	kubectl port-forward service/blueprints-addon-argocd-server -n argocd 8080:443
	
deploy:
	cd $(CDK_PATH) && cdk deploy --profile lab  --all --concurrency 5 --require-approval never --outputs-file $(CURDIR)/outputs.json

destroy:
#	eksctl delete iamserviceaccount --config-file=./tmp/service_account.yaml --approve 
	cd $(CDK_PATH) && cdk destroy --all 

dashboard:
	./scripts/k8_dashboard.sh

spring-apps:
	./scripts/springapp.sh

bootstrap:
	@for LIB in $(HOMEBREW_LIBS) ; do \
		LIB=$$LIB make check-lib ; \
    done
	cd $(CDK_PATH) && npm install
	cdk bootstrap aws://$(AWS_ACCOUNT)/$(AWS_REGION)


check-lib:
ifeq ($(shell brew ls --versions $(LIB)),)
	@echo Installing $(LIB) via Hombrew
	@brew install $(LIB)
else
	@echo $(LIB) is already installed, skipping.
endif
