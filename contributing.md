# Contributing to Bluebox

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
2. Create a new branch `git checkout -b MY_BRANCH_NAME`
3. Install yarn: `npm install -g yarn`
4. Install the dependencies: `yarn`
5. Run `yarn dev` to build and watch for code changes
6. The development branch is `canary` (this is the branch pull requests should be made against). On a release, the relevant parts of the changes in the `canary` branch are rebased into `master`.