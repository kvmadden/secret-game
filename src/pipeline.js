/**
 * Script verification pipeline.
 * Scripts flow: UNVERIFIED → READY → SERVED
 */

export class Pipeline {
  constructor() {
    this.unverified = 0; // Scripts waiting to be verified
    this.ready = 0;      // Verified, waiting for patient pickup
    this.served = 0;     // Total served (stat tracking)
  }

  addScript(count = 1) {
    this.unverified += count;
  }

  canVerify() {
    return this.unverified > 0;
  }

  verify() {
    if (this.unverified > 0) {
      this.unverified--;
      this.ready++;
      return true;
    }
    return false;
  }

  canServe() {
    return this.ready > 0;
  }

  serve() {
    if (this.ready > 0) {
      this.ready--;
      this.served++;
      return true;
    }
    return false;
  }

  // Queue pressure contribution from pipeline
  getPressure() {
    return this.unverified * 2 + this.ready * 1;
  }
}
