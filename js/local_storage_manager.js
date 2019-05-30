function LocalStorageManager() {
    this.bestScoreKey = 'bestScore'
    
    this.storage = window.localStorage
}

LocalStorageManager.prototype.getBestScore = function() {
    return this.storage.getItem(this.bestScoreKey) || 0;
}

LocalStorageManager.prototype.setBestScore = function(score) {
    this.storage.setItem(this.bestScoreKey, score)
}

LocalStorageManager.prototype.setBestScoreToZero = function() {
    this.storage.setItem(this.bestScoreKey, 0)
}