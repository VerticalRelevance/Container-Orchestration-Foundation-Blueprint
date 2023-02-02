#!/bin/bash
CDK_PATH  := $(PWD)/cdk
APP_PATH  := $(PWD)/cdk/blueprint
ARGO_PWD  :=`kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd git-remote-codecommit

all: bootstrap build
	
build:
	cd $(APP_PATH) && npm install
	make deploy
	aws eks update-kubeconfig --name blueprint --region us-east-2 
	./scripts/k8_dashboard.sh
	./scripts/service_account.sh
	cd $(APP_PATH)/spring-frontend && git init && git remote add origin codecommit::us-east-2://spring-frontend && git push -u origin/main main
	cd $(APP_PATH)/spring-backend && git init && git remote add origin codecommit::us-east-2://spring-backend && git push -u origin/main main

argo-proxy:
	echo $(ARGO_PWD)
	kubectl port-forward service/blueprints-addon-argocd-server -n argocd 8080:443
	
deploy:
	cd $(APP_PATH) && cdk deploy --all 

destroy:
	cd $(CDK_PATH) && cdk destroy --all 

bootstrap:
	@for LIB in $(HOMEBREW_LIBS) ; do \
		LIB=$$LIB make check-lib ; \
    done

check-lib:
ifeq ($(shell brew ls --versions $(LIB)),)
	@echo Installing $(LIB) via Hombrew
	@brew install $(LIB)
else
	@echo $(LIB) is already installed, skipping.
endif