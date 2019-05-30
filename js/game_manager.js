function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size = size; // size of the grid
  this.inputManager = new InputManager;
  this.actuator = new Actuator;
  this.storageManager = new StorageManager;

  this.startTiles = 2;

  this.inputManager.on('move', this.move.bind(this))
  this.inputManager.on('restart', this.restart.bind(this))
  this.inputManager.on('keepPlaying', this.keepPlaying.bind(this))

  this.setup();
}

GameManager.prototype.restart = function () {
  this.actuator.continueGame()
  this.setup()
}

GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true
  this.actuator.continueGame()
}

GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying)
}

GameManager.prototype.setup = function () {

  preState = false;
  if (preState) {
    this.grid = new Grid(preState.grid.size, preState.grid.cells);
    this.score = preState.score
    this.over = preState.over
    this.won = preState.won
    this.keepPlaying = preState.keepPlaying
  } else {
    this.grid = new Grid(this.size);
    this.score = 0
    this.over = false
    this.won = false
    this.keepPlaying = false
    this.addStartTiles()
  }

  this.actuate()
}

GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile()
  }
}
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4
    var tile = new Tile(this.grid.randomAvailableCell(), value)
    this.grid.insertTile(tile)
  }
}

GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score)
  }

  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
    bestScore: this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });
}

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  })
}

GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null
  this.grid.cells[cell.x][cell.y] = tile
  tile.updatePosition(cell)
}

GameManager.prototype.move = function (direction) {
  var self = this
  if (this.isGameTerminated()) return

  var cell, tile
  var vector = this.getVector(direction)
  var travelsal = this.travelsal(vector)
  var moved = false
  this.prepareTiles()

  travelsal.x.forEach((x) => {
    travelsal.y.forEach((y) => {
      cell = {
        x: x,
        y: y
      }
      tile = self.grid.cellContent(cell)

      if (tile) {
        var pos = self.findPos(cell, vector)
        var next = self.grid.cellContent(pos.next)
        
        if (next && next.value === tile.value && !next.mergedFrom) {
          
          var merged = new Tile(pos.next, tile.value * 2)
          merged.mergedFrom = [tile, next]

          self.grid.insertTile(merged)
          self.grid.removeTile(tile)

          tile.updatePosition(pos.next)
          self.score += merged.value

          if (merged.value === 2048) self.won = true
        } else {
          self.moveTile(tile, pos.pos)
        }

        if (!self.positionEqual(cell, tile)) {
          moved = true // the tile moved from its original cell
        }
      }
    })
  });
  if (moved) {
    this.addRandomTile();
    if (!this.movable()) {
      this.over = true //Game over
    }
    this.actuate()
  }
}

GameManager.prototype.getVector = function (direction) {
  var map = {
    0: {
      x: 0,
      y: -1
    }, // Up
    1: {
      x: 1,
      y: 0
    }, // Right
    2: {
      x: 0,
      y: 1
    }, // Down
    3: {
      x: -1,
      y: 0
    }, // Left
  }
  return map[direction]
}

GameManager.prototype.travelsal = function (vector) {
  var grid = {
    x: [],
    y: []
  }
  for (var i = 0; i < this.size; i++) {
    grid.x.push(i)
    grid.y.push(i)
  }
  if (vector.x == 1) grid.x = grid.x.reverse()
  if (vector.y == 1) grid.y = grid.y.reverse()

  return grid
}

GameManager.prototype.findPos = function (cell, vector) {
  var pre
  do {
    pre = cell
    cell = {
      x: pre.x + vector.x,
      y: pre.y + vector.y
    }
  } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell))
  // pos为最远空格处
  return {
    pos: pre,
    next: cell
  }
}

GameManager.prototype.positionEqual = function (a, b) {
  return a.x == b.x && a.y == b.y
}

GameManager.prototype.movable = function () {
  return this.grid.cellsAvailable() || this.tileMovable()
}
GameManager.prototype.tileMovable = function () {
  var self = this
  var tile
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({
        x: x,
        y: y
      })
      if (tile) {
        for (var dir = 0; dir < 4; dir++) {
          var vector = self.getVector(dir)
          var cell = {
            x: x + vector.x,
            y: y + vector.y
          }
          var other = self.grid.cellContent(cell)
          if (other && other.value === tile.value) return true
        }
      }
    }
  }
  return false
}