
function drawArrow(w, h, inset, col){
  // s = createShape();
  beginShape();
  fill(col);
  noStroke();
  vertex(0, 0);
  vertex(inset, h/2);
  vertex(0, h);
  vertex(w, h);
  vertex(w + inset, h/2);
  vertex(w, 0);
  endShape(CLOSE);
}

function drawPhaseDiagram(){
  drawArrow((profilesW + 1.75*MARGIN)/6, (profilesW + 1.75*MARGIN)/12, (profilesW + 1.75*MARGIN)/20, color(100));
  
  fill(color(100, 100, 100, 150));
  translate(0.25*MARGIN + profilesX, MARGIN - 10);
  translate(0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/5, MARGIN - 10);
  fill(P3);
  translate(0.25*MARGIN + profilesX + 2*(profilesW + 1.75*MARGIN)/5, MARGIN - 10);
  fill(color(100, 100, 100, 150));
  translate(0.25*MARGIN + profilesX + 3*(profilesW + 1.75*MARGIN)/5, MARGIN - 10);
  fill(Launch);
  translate(0.25*MARGIN + profilesX + 4*(profilesW + 1.75*MARGIN)/5, MARGIN - 10);  

  fill(255);
  textAlign(CENTER, CENTER);
  var arrowwidth = (profilesW + 1.75*MARGIN)/6;
  var ellx = 0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/12;

  var elly =  MARGIN - 10 +  (profilesW + 1.75*MARGIN)/24;
  textSize(textSizeValue);
  text("Candidate",ellx + textSizeValue, elly - textSizeValue/2);
  text("Selection",ellx + textSizeValue, elly + textSizeValue/2);
  textSize(textSizeValue - 1);
  textAlign(LEFT, CENTER);
  text("PIIb", 0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/12 + (profilesW + 1.75*MARGIN)/5  , elly );
  text("PIII", 0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/12 + 2*(profilesW + 1.75*MARGIN)/5  , elly );
  text("File", 0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/12 + 3*(profilesW + 1.75*MARGIN)/5  , elly );
  textAlign(CENTER, CENTER);
  text("Launch", 0.25*MARGIN + profilesX + (profilesW + 1.75*MARGIN)/12 + 4*(profilesW + 1.75*MARGIN)/5  +textSizeValue , elly );
}