/**
 * Time.ts - Игровое время, день/ночь цикл как в GTA 5
 */
export class Time {
  public gameTime = 12 * 60 // minutes from 0:00, start at noon
  public dayDuration = 24 * 60 // 24 min real = 24h game (как в GTA)
  public timeScale = 60 // 1 real sec = 60 game sec
  
  private _delta = 0
  private _total = 0

  update(delta: number) {
    this._delta = delta
    this._total += delta
    this.gameTime += delta * this.timeScale / 60
    if (this.gameTime >= 24*60) this.gameTime -= 24*60
  }

  get delta() { return this._delta }
  get total() { return this._total }
  
  get hours() { return Math.floor(this.gameTime / 60) }
  get minutes() { return Math.floor(this.gameTime % 60) }
  
  // 0-1, 0 = midnight, 0.5 = noon
  get dayPhase() {
    return (this.gameTime / (24*60))
  }

  // Sun angle for lighting
  get sunAngle() {
    // 0 at midnight, PI at noon
    return this.dayPhase * Math.PI * 2 - Math.PI/2
  }

  get isDay() {
    const h = this.hours
    return h >= 6 && h < 20
  }
}
