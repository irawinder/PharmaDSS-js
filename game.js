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
  loadModel_XLS(agileModel, dataLocation);
  
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
  var continuousMfG = false;
  
  var current = new Turn(0);
  var selectedProfile = 0;
  var selectedSite = 0;
  var selectedSiteBuild = 0;
  var selectedBuild = 0;
  var turnLog = new Array();
  tableHistory = new Array(U_MAX).fill(new Array(V_MAX).fill(new Array(2)));
  
  // Only adds profiles with 5 years advance forecast
  agileModel.activeProfiles = new Array();
  console.log(agileModel.PROFILES);  
  Game.populateProfiles();
  
  // Clear all user-defined builds from each site
  resetSites();
  
  // Clear all user-defined builds from sites
  this.resetSites = function() {
    for (var i=0; i<agileModel.SITES.length; i++) {
      agileModel.SITES.get(i).siteBuild.clear();
    }
  }
  
  // End the turn and commit all events to the Log
  this.execute = function() {  
    if (current.TURN < NUM_INTERVALS) {
      if (connection) {
        tableHistory.add(tablePieceInput);
        println("Colortizer state logged #" + (tableHistory.length - 1));
      }
      turnLog.add(current);
      println("Turn " + current.TURN + " logged");
      
      current = new Turn(current.TURN + 1);
      
      // Only adds profiles to game within known Lead Time
      this.populateProfiles();
      //println("There are now " + agileModel.activeProfiles.size() + " Active Profiles.");
      
      // Updates the Status of builds on each site at end of each turn (age, etc)
      for (var i=0; i<agileModel.SITES.length; i++) {
        agileModel.SITES.get(i).updateBuilds();
      }
      
      // Updates the production capacities for each NCE
      updateProfileCapacities();
      
      // Updates the status of the radar plot to current turn
      calcOutputs(session.current.TURN-1);
      for (var i=0; i<NUM_OUTPUTS; i++) {
        if (i < 3) {
          kpi.setScore(i, 1 - outputs.get(session.current.TURN - 1)[i]/outputMax[i]);
        } else {
          kpi.setScore(i, outputs.get(session.current.TURN - 1)[i]/outputMax[i]);
        }
      }
      displayRadar = true;
    }
  }
  
  // Set the Active Profile selected by the user
  this.setProfile = function(index) {
    selectedProfile = index;
  }

    
}


  // Only adds profiles with 5 years advance forecast
  Game.populateProfiles = function() {
    
    // When not in game mode, all profiles are viewed in their entirety (i.e. Omnipotent mode..)
    for (var i=0; i<agileModel.PROFILES.length; i++) {
      if (agileModel.PROFILES.get(i).timeLead == current.TURN || (current.TURN == 0 && agileModel.PROFILES.get(i).timeLead < 0) ) {
        agileModel.PROFILES.get(i).globalProductionLimit = 0;
        agileModel.PROFILES.get(i).initCapacityProfile();
        agileModel.activeProfiles.add(agileModel.PROFILES.get(i));
      }
    }
    
    // When game is active, only populate profiles that are visibile by 5-yr forecasts on first turn
    if (current.TURN == 0) {
      for (var i=0; i<agileModel.activeProfiles.length; i++) {
        if (agileModel.activeProfiles.get(i).timeEnd + 1 < current.TURN) {
          
          // Resets selection to 0 if current profile is being deleted
          if (selectedProfile == i) selectedProfile = 0;
          
          agileModel.activeProfiles.remove(i);
          
          // keeps current profile selected if one behind it is removed
          if (selectedProfile > i) selectedProfile--;
            
        }
      }
    }
  }

// A class that holds information about events executed during each turn
function Turn(TURN){
  this.TURN = TURN;
  var event = new Array();  
}

// An Event might describe a change to the system initiated by (a) the user or (b) external forces
function Event(eventType, siteIndex, buildIndex, profileIndex = "None") {
  this.eventType = eventType;
  this.siteIndex = siteIndex;
  this.buildIndex = buildIndex;
  this.profileIndex = profileIndex;

  if (this.profileIndex == "None") {
    flagRemove();
  } else {
    if (eventType.equals("deploy")) {
      // stage a build/deployment event based upon pre-engineered modules 
      stage();
    } else if (eventType.equals("initialize")) {
      // init. a build/deployment event based upon pre-engineered modules 
      initialize();
    } else if (eventType.equals("repurpose")) {
      // stage a build/deployment event based upon pre-engineered modules 
      this.siteBuildIndex = buildIndex;
      flagRepurpose();
    }
  }
    
  // stage a build/deployment event based upon pre-engineered modules 
  this.stage = function() {
    var event = new Build();
    
    // Copy Ideal Build attributes to site-specific build
    event.name         = agileModel.GMS_BUILDS.get(buildIndex).name;
    event.capacity     = agileModel.GMS_BUILDS.get(buildIndex).capacity;
    event.buildCost    = agileModel.GMS_BUILDS.get(buildIndex).buildCost;
    event.buildTime    = agileModel.GMS_BUILDS.get(buildIndex).buildTime;
    event.repurpCost   = agileModel.GMS_BUILDS.get(buildIndex).repurpCost;
    event.repurpTime   = agileModel.GMS_BUILDS.get(buildIndex).repurpTime;
    event.labor        = agileModel.GMS_BUILDS.get(buildIndex).labor;
    event.editing      = true;
    
    // Customizes a Build for a given NCE
    event.assignProfile(profileIndex);
    
    // Add the NCE-customized Build to the given Site
    agileModel.SITES.get(siteIndex).siteBuild.add(event);
  }
  
  // stage a build/deployment event based upon pre-engineered modules 
  this.initialize = function() {
    var event = new Build();
    
    // Copy Ideal Build attributes to site-specific build
    event.name         = agileModel.GMS_BUILDS.get(buildIndex).name;
    event.capacity     = agileModel.GMS_BUILDS.get(buildIndex).capacity;
    event.buildCost    = agileModel.GMS_BUILDS.get(buildIndex).buildCost;
    event.buildTime    = agileModel.GMS_BUILDS.get(buildIndex).buildTime;
    event.repurpCost   = agileModel.GMS_BUILDS.get(buildIndex).repurpCost;
    event.repurpTime   = agileModel.GMS_BUILDS.get(buildIndex).repurpTime;
    event.labor        = agileModel.GMS_BUILDS.get(buildIndex).labor;
    event.editing      = true;
    
    // Customizes a Build for a given NCE
    event.assignProfile(profileIndex);
    event.age          = int(event.buildTime - agileModel.PROFILES.get(profileIndex).timeLaunch);
    event.capEx_Logged = true;
    
    // Add the NCE-customized Build to the given Site
    agileModel.SITES.get(siteIndex).siteBuild.add(event);
  }
  
  this.flagRemove = function() {
    var current = agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex);
    if (current.editing) {
      agileModel.SITES.get(siteIndex).siteBuild.remove(siteBuildIndex);
    } else {
      agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).demolish = true;
    }
    
  }
  
  this.flagRepurpose = function() {
    if (agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).built == false) {
      game_message ="Can't repurpose while under construction";
      println("Can't Repurpose while Under Construction");
    } else {
      agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).repurpose = true;
      agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).built = false;
      agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).age = 0;
      agileModel.SITES.get(siteIndex).siteBuild.get(siteBuildIndex).PROFILE_INDEX = profileIndex;
      game_message = " ";
    }
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
  
  println("Profile: " + (session.selectedProfile+1));
}

// User Selects Next Available Site
function nextSite() {
  session.selectedSiteBuild = 0;
  if (session.selectedSite >= agileModel.SITES.length - 1) {
    session.selectedSite = 0;
  } else {
    session.selectedSite++;
  }
  println("Site: " + (session.selectedSite+1));
}

// User Selects Next Available Build
function nextBuild() {
  if (session.selectedBuild >= agileModel.GMS_BUILDS.length - 1) {
    session.selectedBuild = 0;
  } else {
    session.selectedBuild++;
  }
  println("GMS Build Type: " + (session.selectedBuild+1));
}

// User Selects Next Available Build on a specific site
function nextSiteBuild() {
  if (agileModel.SITES.get(session.selectedSite).siteBuild.length == 0) {
    game_message = "Site has no Production!";
    println("Site has no Production!");
  } else {
    game_message = " ";
    if (session.selectedSiteBuild >= agileModel.SITES.get(session.selectedSite).siteBuild.length - 1) {
      session.selectedSiteBuild = 0;
    } else {
      session.selectedSiteBuild++;
    }
    println("Site " + session.selectedSite + " Build Type: " + (session.selectedSiteBuild+1));
  }
}

// Build Selected Manufacturing Option
function deploySelection() {
  game_message = " ";
  try {
    var deploy = new Event("deploy", session.selectedSite, session.selectedBuild, agileModel.activeProfiles.get(session.selectedProfile).ABSOLUTE_INDEX);
    session.current.event.add(deploy);
    
  } catch (e) {
    println("deploySelection() failed to execute");
  }
  updateProfileCapacities();
}

// Remove Selected Manufacturing Option
function removeSelection() {
  var remove = new Event("remove", session.selectedSite, session.selectedSiteBuild);
  session.current.event.add(remove);
  updateProfileCapacities();
}

// Repurpose Selected Manufacturing Option
function repurposeSelection() {
  var repurpose = new Event("repurpose", session.selectedSite, session.selectedSiteBuild, agileModel.activeProfiles.get(session.selectedProfile).ABSOLUTE_INDEX);
  session.current.event.add(repurpose);
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
    if (profile == agileModel.activeProfiles.get(i).ABSOLUTE_INDEX) {
      index = i;
      break;
    }
  }
  return index;
}
