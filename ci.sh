#!/bin/sh
    
ci_test()
{
    yarn test

    # Execute a one way compatibility test :
    # generate a ledger file and parse it with Ledger CLI inside a docker container
    rm -rf temp
    mkdir temp
    ./node_modules/.bin/ts-node src/app/shared/services/ledger/__tests__/ledger.service.compatibility.ts > temp/sample.ledger
    docker run --rm -v "$PWD"/temp:/samples dcycle/ledger:1 -f /samples/sample.ledger reg
}

ci_build_prod()
{
    yarn ng build --prod
}

ci_compile_windows()
{
    ci_build_prod

    # docker run parameters : 
    # tty
    # inject environment variables
    # mount artifacts folder to get build output
    # mount project directory volume
    # mount electron directory volume
    # mount electron-builder directory volume
    # specify image
    # build windows binary

    # https://github.com/electron-userland/electron-builder/issues/2450

    docker run \
    --rm \
    -ti \
    --env-file <(env | grep -vE '\r|\n' | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
    -v ${PWD}/dist:/project/dist \
    -v ${PWD}:/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "yarn --link-duplicates --pure-lockfile && yarn electron-builder build --win" 
}

ci_compile_mac()
{
    ci_build_prod
    yarn electron-builder build --mac
}

ci_deploy_firebase()
{
    ci_build_prod
    yarn firebase deploy --token $FIREBASE_TOKEN
}
