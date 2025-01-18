"use strict";

class ProvidedRuntime {
  constructor(serverless) {
    this.serverless = serverless;
    this.log = serverless.cli.log;
    this.provider = this.serverless.getProvider("aws");

    this.hooks = {
      "after:package:createDeploymentArtifacts": this.afterPackage.bind(this),
    };
  }

  async afterPackage() {
    this.log("\n# Setting provided runtime\n");

    this.serverless.configurationInput.provider.runtime = "provided.al2";
  }
}

module.exports = ProvidedRuntime;
