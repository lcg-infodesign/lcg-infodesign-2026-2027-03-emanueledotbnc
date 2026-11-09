// DEGREES OF FLOW - un glifo per ogni fiume, raggruppati per continente

// tabella con i dati dei fiumi
let myTable;
let numRivers;


let maxLength;
let minLength;
let riversPerContinent = []; // quanti fiumi ha ogni continente

// continenti, nell'ordine in cui vengono disegnati
let continentNames = ["North America", "South America", "Africa", "Asia", "Europe", "Oceania"];

// colori del progetto
let colorBackground = [15, 23, 42];
let colorGrey = [217, 217, 217];
let temperatureColors = [
  [59, 130, 246],   // [0] freddo
  [103, 232, 249],  // [1] temperato
  [239, 68, 68]     // [2] caldo
];
let temperatureLabels = ["Cold Waters  (< 5 °C)", "Temperate Waters  (5 – 18 °C)", "Tropical & Warm Waters  (> 18 °C)"];

// geometria del cerchio
let centerX;
let centerY;
let radius;
let gapBetweenContinents = 9;                      // spazio tra i continenti (gradi)
let startAngle = 135 + gapBetweenContinents / 2;   // angolo del primo continente (gradi)
let anglePerRiver;
let minDiameter;
let maxDiameter;

// fiume sotto al mouse (vuoto se nessuno)
let selectedName = "";
let selectedLength = 0;


async function setup() {
  createCanvas(windowWidth, windowHeight); 

  myTable = await loadTable("../assets/rivers.csv", ",", "header");

  frameRate(30);
  angleMode(DEGREES); // gli angoli sono espressi in gradi
  textFont("Helvetica");

  // calcoli fatti una volta sola
  numRivers = myTable.getRowCount();
  prepareData();

  // geometria del cerchio
  centerX = width * 0.6;
  centerY = height * 0.52;
  radius = height * 0.34;
  if (radius > width * 0.3) {
    radius = width * 0.3;
  }
  anglePerRiver = (360 - 6 * gapBetweenContinents) / numRivers;
  minDiameter = radius * 0.02;
  maxDiameter = radius * 0.055;
}

// restituisce il continente di una riga, accorpando Australia in Oceania
function getContinent(row) {
  let continent = myTable.getString(row, "continent");
  if (continent === "Australia") {
    continent = "Oceania";
  }
  return continent;
}

// calcola lunghezza minima e massima, e quanti fiumi ha ogni continente
function prepareData() {
  maxLength = 0;
  minLength = myTable.getNum(0, "length");
  for (let i = 0; i < numRivers; i++) {
    let len = myTable.getNum(i, "length");
    if (len > maxLength) {
      maxLength = len;
    }
    if (len < minLength) {
      minLength = len;
    }
  }

  for (let c = 0; c < continentNames.length; c++) {
    let count = 0;
    for (let i = 0; i < numRivers; i++) {
      if (getContinent(i) === continentNames[c]) {
        count = count + 1;
      }
    }
    riversPerContinent.push(count);
  }
}

// determina se il mouse è sopra la punta di un fiume
function isMouseOverRiver(x, y, diameter) {
  let dx = mouseX - x;
  let dy = mouseY - y;
  let r = diameter / 2 + 2;
  return (dx * dx + dy * dy < r * r);
}

// disegna archi ed etichette dei continenti
function drawContinents() {
  push();
  let angle = startAngle;
  for (let c = 0; c < continentNames.length; c++) {
    let count = riversPerContinent[c];
    let middleAngle = angle + (count * anglePerRiver) / 2;

    // arco continuo attorno al cerchio
    noFill();
    stroke(100, 116, 139);
    strokeWeight(1.5);
    arc(centerX, centerY, radius * 2.24, radius * 2.24, angle, angle + count * anglePerRiver);

    // etichetta del continente
    let labelX = centerX + radius * 1.32 * cos(middleAngle);
    let labelY = centerY + radius * 1.32 * sin(middleAngle);
    noStroke();
    textAlign(CENTER, CENTER);
    fill(226, 232, 240);
    textSize(14);
    text(continentNames[c], labelX, labelY);
    fill(colorGrey);
    textSize(12);
    text(count + " rivers", labelX, labelY + 16);

    // passo al continente successivo
    angle = angle + count * anglePerRiver + gapBetweenContinents;
  }
  pop();
}

// disegna tutti i fiumi, continente per continente, e aggiorna il fiume selezionato
function drawRivers() {
  selectedName = "";
  selectedLength = 0;

  let angle = startAngle;
  for (let c = 0; c < continentNames.length; c++) {
    let positionInContinent = 0;

    for (let i = 0; i < numRivers; i++) {
      if (getContinent(i) === continentNames[c]) {
        let len = myTable.getNum(i, "length");
        let avgTemp = myTable.getNum(i, "avg_temp");

        // colore in base alla temperatura: indice 0, 1 o 2 nell'array
        let colorIndex = 2;
        if (avgTemp < 5) {
          colorIndex = 0;
        } else if (avgTemp <= 18) {
          colorIndex = 1;
        }
        let riverColor = temperatureColors[colorIndex];

        let riverAngle = angle + (positionInContinent + 0.5) * anglePerRiver;
        let x = centerX + radius * cos(riverAngle);
        let y = centerY + radius * sin(riverAngle);
        let diameter = map(len, 0, maxLength, minDiameter, maxDiameter);

        // rollover
        let isOver = isMouseOverRiver(x, y, diameter);
        if (isOver) {
          selectedName = myTable.getString(i, "name");
          selectedLength = len;
        }

        push();
        // linea dal centro fino alla punta
        stroke(riverColor);
        strokeWeight(1.6);
        if (isOver) {
          strokeWeight(3.5);
        }
        line(centerX, centerY, x, y);

        // cerchio trasparente in punta
        let transparency = 64;
        if (isOver) {
          stroke(255);
          strokeWeight(1.5);
          transparency = 150;
        } else {
          noStroke();
        }
        fill(riverColor[0], riverColor[1], riverColor[2], transparency);
        ellipse(x, y, diameter, diameter);

        // puntino pieno al centro della punta
        noStroke();
        fill(riverColor);
        ellipse(x, y, 4, 4);
        pop();

        positionInContinent = positionInContinent + 1;
      }
    }

    // passo al continente successivo
    angle = angle + riversPerContinent[c] * anglePerRiver + gapBetweenContinents;
  }

  // punto grigio centrale per coprire l'accavallamento delle linee
  push();
  noStroke();
  fill(colorGrey);
  ellipse(centerX, centerY, 12, 12);
  pop();
}

// mostra nome e lunghezza del fiume sotto al mouse
function drawTooltip() {
  if (selectedName === "") {
    return;
  }

  push();
  let xText = mouseX + 18;
  textAlign(LEFT, BOTTOM);
  if (mouseX > width / 2) {
    xText = mouseX - 18;
    textAlign(RIGHT, BOTTOM);
  }

  stroke(15, 23, 42);
  strokeWeight(4);
  strokeJoin(ROUND);
  fill(255);
  textSize(16);
  text(selectedName, xText, mouseY - 24);
  textSize(14);
  text(selectedLength + " km", xText, mouseY - 6);
  pop();
}

// disegna titolo e legenda
function drawTitleAndLegend() {
  push();
  noStroke();
  textAlign(LEFT, TOP);

  // titolo
  fill(241, 245, 249);
  textSize(46);
  textStyle(BOLD);
  text("DEGREES OF FLOW", 48, 40);
  fill(colorGrey);
  textSize(15);
  textStyle(NORMAL);
  text(numRivers + " rivers, one glyph each, grouped by continent", 48, 100);
  text("Move your mouse over a river tip to view its name and length", 48, 122);

  // legenda: classificazione termica
  let xLegend = 48;
  let yLegend = 190;
  fill(226, 232, 240);
  textSize(14);
  textStyle(BOLD);
  text("Thermal Classification", xLegend, yLegend + 36);

  textSize(13);
  textStyle(NORMAL);
  for (let k = 0; k < temperatureColors.length; k++) {
    fill(temperatureColors[k]);
    text(temperatureLabels[k], xLegend, yLegend + 63 + k * 22);
  }

  // legenda: estensione idrografica
  fill(226, 232, 240);
  textSize(14);
  textStyle(BOLD);
  text("Hydrographic Extension", xLegend, yLegend + 148);

  let legendMinDiameter = map(minLength, 0, maxLength, minDiameter, maxDiameter);
  fill(148, 163, 184, 90);
  ellipse(xLegend + 10, yLegend + 182, legendMinDiameter, legendMinDiameter);
  ellipse(xLegend + 150, yLegend + 182, maxDiameter, maxDiameter);

  fill(203, 213, 225);
  textSize(13);
  textStyle(NORMAL);
  text(minLength + " km", xLegend + 24, yLegend + 175);
  text(maxLength + " km", xLegend + 150 + maxDiameter / 2 + 8, yLegend + 175);
  pop();
}

function draw() {
  background(colorBackground);

  drawContinents();
  drawRivers();
  drawTooltip();
  drawTitleAndLegend();
}