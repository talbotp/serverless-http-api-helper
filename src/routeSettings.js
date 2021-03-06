'use strict';

const get = require('lodash.get');

const config = require('./config');

const isNonNegativeInteger = (val) => {
  return Number.isInteger(val) && val >= 0;
}

const chooseSetting = (routeSetting, defaultSetting) => {
  if (typeof routeSetting !== 'undefined') {
    return routeSetting;
  }
  return defaultSetting;
}

class RouteSettings {

  constructor(functionName, path, method, detailedMetricsEnabled, burstLimit, rateLimit) {
    this.functionName           = functionName;
    this.path                   = path;
    this.method                 = method;
    this.detailedMetricsEnabled = detailedMetricsEnabled;
    this.burstLimit             = burstLimit;
    this.rateLimit              = rateLimit;
    this.validate();
  }

  /**
   * Validate RouteSettings. Note, functionName, path and method are provided by serverless, so no need to validate these.
   */
  validate() {
    if (!(typeof this.detailedMetricsEnabled === 'undefined') && !(typeof this.detailedMetricsEnabled === 'boolean')) {
      throw new Error(`[${config.app}] detailedMetricsEnabled must be boolean.`);
    }

    if (!(typeof this.burstLimit === 'undefined') && !isNonNegativeInteger(this.burstLimit)) {
      throw new Error(`[${config.app}] burstLimit must be greater than or equal to 0.`);
    }

    if (!(typeof this.rateLimit === 'undefined') && !isNonNegativeInteger(this.rateLimit)) {
      throw new Error(`[${config.app}] rateLimit must be greater than or equal to 0.`);
    }
  }

  getRouteKey() {
    return `${this.method} ${this.path}`;
  }

  static buildDefaultRouteSettings(serverless) {
    const metricsEnabled  = get(serverless, `service.custom.${config.key}.detailedMetricsEnabled`);
    const burstLimit      = get(serverless, `service.custom.${config.key}.burstLimit`);
    const rateLimit       = get(serverless, `service.custom.${config.key}.rateLimit`);
    return new RouteSettings(undefined, undefined, undefined, metricsEnabled, burstLimit, rateLimit);
  }

  static buildRouteSettings(functionName, event, defaultRouteSettings) {
    const path            = get(event, `httpApi.path`);
    const method          = get(event, `httpApi.method`);
    const metricsEnabled  = get(event, `httpApi.${config.key}.detailedMetricsEnabled`);
    const burstLimit      = get(event, `httpApi.${config.key}.burstLimit`);
    const rateLimit       = get(event, `httpApi.${config.key}.rateLimit`);

    // Must choose default route settings if otherwise undefined, or will use account limits.
    const actualMetricsEnabled  = chooseSetting(metricsEnabled, defaultRouteSettings.metricsEnabled);
    const actualBurstLimit      = chooseSetting(burstLimit, defaultRouteSettings.burstLimit);
    const actualRateLimit       = chooseSetting(rateLimit, defaultRouteSettings.rateLimit);

    return new RouteSettings(functionName, path, method, actualMetricsEnabled, actualBurstLimit, actualRateLimit);
  }

}

module.exports = RouteSettings;
