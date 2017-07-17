function buildCost(capacity) {
  return 1000000 * ( 1.4 * (capacity - 0.5) + 2.0 ); //GBP
}

// Based on Capacity (tons), calculates build time for a facility in years
function buildTime(capacity) {
  if (capacity <= 10) {
    return 3; //yr
  } else if (capacity <= 20) {
    return 4; //yr
  } else {
    return 5; //yr
  }
}

// Returns an array of integers (0 - amt) but randomized.
// For example, if amt = 10, outputs: {2, 6, 9, 7, 0, 8, 5, 1, 3, 4}

function randomIndex(amt) {
  var list = new Array(amt);
  
  //sets all values to -1
  for (var i=0; i<amt; i++) list[i] = -1;
  
  var random;
  var allocated = 0;
  while(allocated < amt) {
    random = int(random(0, amt));
    if (random < 0 || random >= amt) random = 0; // checks in bounds
    if (list[random] == -1) {
      list[random] = allocated;
      allocated ++;
    }
  }
  return list;
}

// Returns an array of integers (0 - amt) in accending order.
// For example, if amt = 10, outputs: {0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

function accendingIndex(amt) {
  var list = new Array(amt);
  for (var i=0; i<amt; i++) list[i] = i;
  return list;
}