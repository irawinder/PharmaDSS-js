var gameMode = false;

// Regenerate Game
function regenerateGame() {
  var interrupt = false;

  if (gameMode) {
    interrupt = true;
    gameMode = false;
  }
  
  // Initiate MFG_System and Objects
  agileModel = new MFG_System();
  //Initiate Game
  loadRules(agileModel, gmsRulesFile, gmsCapacityFile, gmsLabourFile, rndPPFile, rndRulesFile, supplyRulesFile, profileDataFile);
  
  session = new Game();
  updateProfileCapacities();
  
  // Turns game back on if interrupted so god mode is never seen
  if (interrupt) {
    gameMode = true;
  }
  
  // Calculates Max Capacity Site
  agileModel.maxCapacity();
  
  // Generate New Basins for Sites
  mfg.resetCellTypes();
  generateBasins();
  
  //resets Scores
  flatOutputs();
  
  // Reset Table Pieces
  fauxPieces(2, tablePieceInput, 15);
}

// Game, Turn, Event classes help log and manage actions over the passage of time
// Games are made up of a series of Turns, and Turns are made up of 0 or more events that effect the system.
function Game() {
  continuousMfG = false;
  this.current = new Turn(0);
  this.selectedProfile = 0;
  this.selectedSite = 0;
  this.selectedSiteBuild = 0;
  this.selectedBuild = 0;
  this.turnLog = new Array();
  this.tableHistory = new Array(U_MAX).fill(new Array(V_MAX).fill(new Array(2)));
  
  // Only adds profiles with 5 years advance forecast
  agileModel.activeProfiles = new Array();
  this.populateProfiles();
  
  // Clear all user-defined builds from each site
  this.resetSites();
  
  // End the turn and commit all events to the Log
  this.execute = function() {  
    if (this.current.TURN < NUM_INTERVALS) {
      if (connection) {
        this.tableHistory.push(tablePieceInput);
        print("Colortizer state logged #" + (this.tableHistory.length - 1));
      }
      this.turnLog.push(this.current);
      print("Turn " + this.current.TURN + " logged");
      
      this.current = new Turn(this.current.TURN + 1);
      
      // Only adds profiles to game within known Lead Time
      this.populateProfiles();
      //print("There are now " + agileModel.activeProfiles.length + " Active Profiles.");
      
      // Updates the Status of builds on each site at end of each turn (age, etc)
      for (var i=0; i<agileModel.SITES.length; i++) {
        agileModel.SITES[i].updateBuilds();
      }
      
      // Updates the production capacities for each NCE
      updateProfileCapacities();
      
      // Updates the status of the radar plot to current turn
      calcOutputs(session.current.TURN-1);
      for (var i=0; i<NUM_OUTPUTS; i++) {
        if (i < 3) {
          kpi.setScore(i, 1 - outputs[session.current.TURN - 1][i]/outputMax[i]);
        } else {
          kpi.setScore(i, outputs[session.current.TURN - 1][i]/outputMax[i]);
        }
      }
      displayRadar = true;
    }
  }
  
  // Set the Active Profile selected by the user
  this.setProfile = function(index) {
    this.selectedProfile = index;
  }   
}

// Clear all user-defined builds from sites
Game.prototype.resetSites = function() {
  for (var i=0; i<agileModel.SITES.length; i++) {
    agileModel.SITES[i].siteBuild = new Array();
  }
}

// Only adds profiles with 5 years advance forecast
Game.prototype.populateProfiles = function() {
  // When not in game mode, all profiles are viewed in their entirety (i.e. Omnipotent mode..)
  for (var i=0; i<agileModel.PROFILES.length; i++) {
    if (agileModel.PROFILES[i].timeLead == this.current.TURN || (this.current.TURN == 0 && agileModel.PROFILES[i].timeLead < 0) ) {
      agileModel.PROFILES[i].globalProductionLimit = 0;
      agileModel.PROFILES[i].initCapacityProfile();
      agileModel.activeProfiles.push(agileModel.PROFILES[i]);
    }
  }
  
  // When game is active, only populate profiles that are visibile by 5-yr forecasts on first turn
  if (this.current.TURN == 0) {
    for (var i=0; i<agileModel.activeProfiles.length; i++) {
      if (agileModel.activeProfiles[i].timeEnd + 1 < this.current.TURN) {
        
        // Resets selection to 0 if current profile is being deleted
        if (this.selectedProfile == i) this.selectedProfile = 0;
        
        agileModel.activeProfiles.remove(i);
        
        // keeps current profile selected if one behind it is removed
        if (this.selectedProfile > i) this.selectedProfile--;
          
      }
    }
  }
}

// A class that holds information about events executed during each turn
function Turn(TURN){
  this.TURN = TURN;
  var event = new Array();  
}

var siteBuildIndex;

// An Event might describe a change to the system initiated by (a) the user or (b) external forces
function Event(eventType, siteIndex, buildIndex, profileIndex = "None") {
  this.eventType = eventType;
  this.siteIndex = siteIndex;
  this.buildIndex = buildIndex;
  this.profileIndex = profileIndex;

  if (this.profileIndex == "None") {
    this.flagRemove();
  } else {
    if (this.eventType == "deploy") {
      // stage a build/deployment event based upon pre-engineered modules 
      this.stage();
    } else if (this.eventType == "initialize") {
      // init. a build/deployment event based upon pre-engineered modules 
      this.initialize();
    } else if (this.eventType == "repurpose") {
      // stage a build/deployment event based upon pre-engineered modules 
      siteBuildIndex = buildIndex;
      this.flagRepurpose();
    }
  }
}


// stage a build/deployment event based upon pre-engineered modules 
Event.prototype.stage = function() {
  var event = new Build();
  
  // Copy Ideal Build attributes to site-specific build
  event.name         = agileModel.GMS_BUILDS[this.buildIndex].name;
  event.capacity     = agileModel.GMS_BUILDS[this.buildIndex].capacity;
  event.buildCost    = agileModel.GMS_BUILDS[this.buildIndex].buildCost;
  event.buildTime    = agileModel.GMS_BUILDS[this.buildIndex].buildTime;
  event.repurpCost   = agileModel.GMS_BUILDS[this.buildIndex].repurpCost;
  event.repurpTime   = agileModel.GMS_BUILDS[this.buildIndex].repurpTime;
  event.labor        = agileModel.GMS_BUILDS[this.buildIndex].labor;
  event.editing      = true;
  
  // Customizes a Build for a given NCE
  event.assignProfile(this.profileIndex);
  
  // Add the NCE-customized Build to the given Site
  agileModel.SITES[this.siteIndex].siteBuild.push(event);
}

// stage a build/deployment event based upon pre-engineered modules 
Event.prototype.initialize = function() {
  var event = new Build();
  
  // Copy Ideal Build attributes to site-specific build
  event.name         = agileModel.GMS_BUILDS[this.buildIndex].name;
  event.capacity     = agileModel.GMS_BUILDS[this.buildIndex].capacity;
  event.buildCost    = agileModel.GMS_BUILDS[this.buildIndex].buildCost;
  event.buildTime    = agileModel.GMS_BUILDS[this.buildIndex].buildTime;
  event.repurpCost   = agileModel.GMS_BUILDS[this.buildIndex].repurpCost;
  event.repurpTime   = agileModel.GMS_BUILDS[this.buildIndex].repurpTime;
  event.labor        = agileModel.GMS_BUILDS[this.buildIndex].labor;
  event.editing      = true;
  
  // Customizes a Build for a given NCE
  event.assignProfile(this.profileIndex);
  event.age          = int(event.buildTime - agileModel.PROFILES[this.profileIndex].timeLaunch);
  event.capEx_Logged = true;
  
  // Add the NCE-customized Build to the given Site
  agileModel.SITES[this.siteIndex].siteBuild.push(event);
}

Event.prototype.flagRemove = function() {
  print(agileModel.SITES[0]);
  var c = agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex];

  if (c.editing) {
    agileModel.SITES[this.siteIndex].siteBuild.remove(siteBuildIndex);
  } else {
    agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].demolish = true;
  }
  
}

Event.prototype.flagRepurpose = function() {
  if (agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].built == false) {
    game_message ="Can't repurpose while under construction";
    print("Can't Repurpose while Under Construction");
  } else {
    agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].repurpose = true;
    agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].built = false;
    agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].age = 0;
    agileModel.SITES[this.siteIndex].siteBuild[siteBuildIndex].PROFILE_INDEX = this.profileIndex;
    game_message = " ";
  }
}


// User Selects Next Available Profile
function nextProfile() {
  var numProfiles;
  
  if (!gameMode) {
    numProfiles = agileModel.PROFILES.length;
  } else {
    numProfiles = agileModel.activeProfiles.length;
  }
  
  if (session.selectedProfile >= numProfiles - 1) {
    session.setProfile(session.selectedProfile = 0);
  } else {
    session.setProfile(session.selectedProfile + 1);
  }
  
  print("Profile: " + (session.selectedProfile+1));
}

// User Selects Next Available Site
function nextSite() {
  session.selectedSiteBuild = 0;
  if (session.selectedSite >= agileModel.SITES.length - 1) {
    session.selectedSite = 0;
  } else {
    session.selectedSite++;
  }
  print("Site: " + (session.selectedSite+1));
}

// User Selects Next Available Build
function nextBuild() {
  if (session.selectedBuild >= agileModel.GMS_BUILDS.length - 1) {
    session.selectedBuild = 0;
  } else {
    session.selectedBuild++;
  }
  print("GMS Build Type: " + (session.selectedBuild+1));
}

// User Selects Next Available Build on a specific site
function nextSiteBuild() {
  if (agileModel.SITES[session.selectedSite].siteBuild.length == 0) {
    game_message = "Site has no Production!";
    print("Site has no Production!");
  } else {
    game_message = " ";
    if (session.selectedSiteBuild >= agileModel.SITES[session.selectedSite].siteBuild.length - 1) {
      session.selectedSiteBuild = 0;
    } else {
      session.selectedSiteBuild++;
    }
    print("Site " + session.selectedSite + " Build Type: " + (session.selectedSiteBuild+1));
  }
}

// Build Selected Manufacturing Option
function deploySelection() {
  game_message = " ";
  try {
    var deploy = new Event("deploy", session.selectedSite, session.selectedBuild, agileModel.activeProfiles[session.selectedProfile].ABSOLUTE_INDEX);
    session.current.event.push(deploy);
    
  } catch (e) {
    print("deploySelection() failed to execute");
  }
  updateProfileCapacities();
}

// Remove Selected Manufacturing Option
function removeSelection() {
  var remove = new Event("remove", session.selectedSite, session.selectedSiteBuild);
  session.current.event.push(remove);
  updateProfileCapacities();
}

// Repurpose Selected Manufacturing Option
function repurposeSelection() {
  var repurpose = new Event("repurpose", session.selectedSite, session.selectedSiteBuild, agileModel.activeProfiles[session.selectedProfile].ABSOLUTE_INDEX);
  session.current.event.push(repurpose);
  updateProfileCapacities();
}

// Advance to Next Turn
function endTurn() {
  session.execute();
}

// when given an absolute profile index, returns the active profile index if available
function activeProfileIndex (profile) {
  var index = -1;
  for (var i=0; i<agileModel.activeProfiles.length; i++) {
    if (profile == agileModel.activeProfiles[i].ABSOLUTE_INDEX) {
      index = i;
      break;
    }
  }
  return index;
}
