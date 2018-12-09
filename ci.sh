#!/bin/sh
    
ci_test()
{
    yarn test
}

ci_build_prod()
{
    yarn ng build --prod
}


ci_clean()
{
    rm -rf build
    rm -rf dist
}

ci_compile_windows()
{
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
    --env ELECTRON_CACHE="/root/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
    -v ${PWD}/dist:/project/dist \
    -v ${PWD}:/project \
    -v ${PWD##*/}-node-modules:/project/node_modules \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "yarn --link-duplicates --pure-lockfile && yarn electron-builder build --win --publish never" 
}

ci_compile_mac()
{
    yarn electron-builder build --mac --publish never
}

ci_deploy_firebase()
{
    yarn firebase deploy --token $FIREBASE_TOKEN
}
