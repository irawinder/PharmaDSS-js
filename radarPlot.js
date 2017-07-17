var displayRadar = false;
var kpi;

function setupRadar() {
  kpi = new RadarPlot(NUM_OUTPUTS);
  for (var i=0; i<NUM_OUTPUTS; i++) {
    kpi.setName(i, outputNames[i]);
    kpi.setScore(i, random(1.0));
  }
  
}

// A class to hold information related to a radar plot
function RadarPlot(num) {
  var radarMode = 1; // 0=teal(static);  1 = average score fill; 2 = score cluster fill
  var hilite = -1;
  
  var nRadar; // Number of dimensions in Radar Plot
  var scores;
  var names;
  var avgScore;

  nRadar = num;
  scores = new Array();
  names = new Array();
  avgScore = 0;
  
  for (var i=0; i<nRadar; i++) {
    names.add("");
    scores.push(0.5);
  }
  
  
  this.setName = function(index, name) {
    if (index < nRadar) {
      names.set(index, name);
    }
  }
  
  this.setScore = function(index, value) {
    if (index < nRadar) {
      scores.set(index, min(value, 1.0));
    }
  }
  
  this.updateAvg = function() {
    avgScore = 0;
    for (var i=0; i<nRadar; i++) {
      avgScore += scores.get(i);
    }
    avgScore /= nRadar;
  }
  
  var rot = 0.25*PI;
  this.draw = function(x, y, d) {  

    strokeWeight(2);   
    if (nRadar > 2) {
      
      //Draws radar plot
      for (var i=0; i<nRadar; i++) {
        
        //Draws axes
        stroke("#999999");
        line(x, y, d*cos(rot+i*2*PI/nRadar) + x, d*sin(rot+i*2*PI/nRadar) + y);
        
        //Determine color
        
          
        //draw fills
        noStroke();
        fill(textColor, 100);
        triangle(x, y, scores.get(i)*d*cos(rot+i*2*PI/nRadar) + x, 
                       scores.get(i)*d*sin(rot+i*2*PI/nRadar) + y, 
                       scores.get((i+1)%nRadar)*d*cos(rot+(i+1)%nRadar*2*PI/nRadar) + x, 
                       scores.get((i+1)%nRadar)*d*sin(rot+(i+1)%nRadar*2*PI/nRadar) + y);
        
        //scores
         textAlign(CENTER, CENTER);
         //recolor for the scores
          if(scores.get(i) <= .5){
            RG = lerpColor(color(250, 0, 0),color(255, 255, 0), scores.get(i));}
          else{
            RG = lerpColor(color(255, 255, 0),color(0, 200, 0), scores.get(i));}
         
         fill(RG); 
         if((d+12)*sin(rot+i*2*PI/nRadar) + y < y){
           text(int(100*scores.get(i)) + "%", (d+12)*cos(rot+i*2*PI/nRadar) + x, (d+12)*sin(rot+i*2*PI/nRadar) + y + 15);
         }
         else{
           text(int(100*scores.get(i)) + "%", (d+12)*cos(rot+i*2*PI/nRadar) + x, (d+12)*sin(rot+i*2*PI/nRadar) + y + 13 + 15);
         }
         
         //names
         fill(textColor);
         textAlign(CENTER);
         if((d+12)*sin(rot+i*2*PI/nRadar) + y - 7 < y){
         text(names.get(i), (d+12)*cos(rot+i*2*PI/nRadar) + x, (d+12)*sin(rot+i*2*PI/nRadar) + y - 7);
         }
         else{
         text(names.get(i), (d+12)*cos(rot+i*2*PI/nRadar) + x, (d+12)*sin(rot+i*2*PI/nRadar) + y + 5);
         }
      }

    }
  }
}