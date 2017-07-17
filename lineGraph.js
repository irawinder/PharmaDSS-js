var minx, miny, h, w;
var num_intervals;
var Values = new Array();
var colarray = new Array(5);

function LineGraph(_Values, _x, _y, _w, _h) {
  this.Values = _Values;
  this.minx = _x;
  this.h = _h;
  this.miny = _y + _h;
  this.w = _w;

  //Making a color array of different colors. 
  colarray[0] = color(33, 139, 204);
  colarray[1]=  color(67, 255, 226);
  colarray[2]=  color(149, 75, 209);
  colarray[4]=  color(255, 136, 116);
  colarray[3]=  color(204, 40, 41);
  
  this.draw = function() {
    var posx, posy, posx2, posy2, posx3, posy3 = 0;
    
    //Implement try catch in case of memory leak of array
    try {
      
      for(var i = 0; i<NUM_OUTPUTS; i++) {
        
        //draws legend
        noStroke();
        fill(colarray[i]);
        rect(minx + (4-i)*w/4 - 45, miny - h - 30, 10, 10);
        fill(textColor);
        textAlign(LEFT);
        textSize(textSizeValue);
        text(outputNames[i], minx + (4-i)*w/4 - 30, miny - h - 21 );   
         
        // Only show values for current and prior turns
        var intervals;
        if (gameMode && session.current.TURN > 0) {
          intervals = min(Values.length-1, session.current.TURN-1);
        } else if (!gameMode) {
          intervals = Values.length-1;
        } else {
          intervals = 0;
        }
        
        for(var j = 0; j<intervals; j++) {
           posx  = j*(w/Values.length) + minx;         
           posy = map(100*Values.get(j)[i]/outputMax[i], 0, 100, miny - 10, miny - h + 30);
          
           posx2  = posx + (w/Values.length);
           posy2 = map(100*Values.get(j+1)[i]/outputMax[i], 0, 100, miny - 10, miny - h + 30);
           
           //set colors with the appropriate profile
           fill(colarray[i]);
           strokeWeight(3);
           stroke(colarray[i], 150);
           
           var dim = 2;
           ellipse(posx2, posy2, dim, dim);
           line(posx, posy, posx2, posy2);
           
           //if(mouseX <= posx2 + 5 && mouseX >= posx2 -5 && mouseY <= posy2 + 5 && mouseY >= posy2-5 || (gameMode && j == session.current.TURN-2) || (!gameMode && j == Values.size()-2) ){
           if(mouseX <= posx2 + 5 && mouseX >= posx2 -5 && mouseY <= posy2 + 5 && mouseY >= posy2-5 ) {
             fill(colarray[i], 50);
             ellipse(posx2, posy2, 10, 10);
             
             fill(textColor);
             textAlign(CENTER);
             var val = str(100*Values.get(j+1)[i]/outputMax[i]).substring(0, str(100*Values.get(j+1)[i]/outputMax[i]).indexOf(".")).length();
             text(nf(100*Values.get(j+1)[i], val, 1).substring(0,3) + " " +outputUnits[i], posx2, posy2-10);
           }
        }
      
      //special start and end case to begin the line from the axis
      //unsure why this isn't picking up
      if (!gameMode || session.current.TURN >= 0) {
         fill(colarray[i]);
         strokeWeight(2);
         stroke(colarray[i], 150);
         posx  = minx; 
         posy = map(100*Values.get(0)[i]/outputMax[i], 0, 100, miny - 10, miny - h + 30);
         posx2  = posx + (w/Values.length);
         posy2 = map(100*Values.get(1)[i]/outputMax[i], 0, 100, miny - 10, miny - h + 30);
         var dim = 2;
         if (session.current.TURN == 1) dim = 4;
         ellipse(posx, posy, dim, dim);
         if (!gameMode || session.current.TURN > 1) {
           line(posx, posy, posx2, posy2);
         }
      }
    }
  } catch(e){}
  
    //Axes
    stroke(textColor);
    strokeWeight(1);
    line(minx, miny, minx + w, miny);
    line(minx, miny, minx, miny - h + 20);
    
    //Labels
    fill(textColor);
    textSize(textSizeValue);
    textAlign(CENTER);
    var canH = height - 2.8*MARGIN;
    var bottomAxisY = miny + textSize*2.5;
    
    //Year marks and labels
    text("Year", minx + w/2, bottomAxisY); 
    for(var i = 0; i<Values.length+1; i++) {
      var curyear = 2017+i;
      strokeWeight(1);
      line(minx + i*(w/Values.length), miny + 2, minx + i*(w/Values.length), miny-2);
      if(i % 5 == 0) {
      text(curyear, i*(w/Values.length) + minx, miny + textSize + 2);
      }
    }
    
    //Score marks and labels
    //text(100, minx - 20, miny - h + 23);
    text(0, minx - 10, miny);
    var x = minx - textSize*2;
    var y = miny - h/2;
    pushMatrix();
    translate(x,y);
    rotate(-HALF_PI);
    translate(-x,-y);
    text("Score", x,y);
    popMatrix();
  }
}
