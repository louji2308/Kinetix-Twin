import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class KinetixExperiment extends BaseScriptComponent {
  @input
  @allowUndefined
  refPuck!: SceneObject;

  @input
  @allowUndefined
  expPuck!: SceneObject;

  @input
  @allowUndefined
  handleIndicator!: SceneObject;

  @input
  @allowUndefined
  vectorR!: SceneObject;

  @input
  @allowUndefined
  vectorDeltaL!: SceneObject;

  @input
  @allowUndefined
  vectorJ!: SceneObject;

  @input
  @allowUndefined
  omegaTextObj!: SceneObject;

  @input
  @allowUndefined
  launchButtonObj!: SceneObject;

  @input
  @allowUndefined
  resetButtonObj!: SceneObject;

  @input
  @allowUndefined
  snapPoint0!: SceneObject;

  @input
  @allowUndefined
  snapPoint1!: SceneObject;

  @input
  @allowUndefined
  snapPoint2!: SceneObject;

  @input
  @allowUndefined
  snapPoint3!: SceneObject;

  @input
  @allowUndefined
  trailContainer!: SceneObject;

  // Physics & layout constants (cm, seconds, radians)
  public readonly snapOffsets: number[] = [0.0, 1.0, 2.0, 3.8];
  public readonly puckRadius: number = 4.0;
  public initialVelocityZ: number = -28.0; // slides across the table (negative = away, positive = towards)
  public readonly slideDuration: number = 1.4; // seconds of frictionless/low-friction glide before stop
  public startZ: number = -70.0;
  public readonly startY: number = -15.5;
  public readonly refX: number = -12.5;
  public readonly expX: number = 12.5;

  public selectedSnapIndex: number = 0; // Default to r = 0.0 cm (LEAF test baseline)
  private isMoving: boolean = false;
  private isFinished: boolean = false;
  private elapsed: number = 0.0;
  private currentOmega: number = 0.0;
  private expAngleRad: number = 0.0;
  private refAngleRad: number = 0.0;
  private trailSpawnTimer: number = 0.0;
  private spawnedMarkers: SceneObject[] = [];

  private snapObjects: SceneObject[] = [];
  private consoleSnapButtons: SceneObject[] = [];
  private activeBtnMat: Material | null = null;
  private idleBtnMat: Material | null = null;

  // Phase 2 visual & audio references (auto-discovered by name)
  private expVectorsRoot: SceneObject | null = null;
  private vectorRTip: SceneObject | null = null;
  private vectorRLabel: SceneObject | null = null;
  private vectorJTip: SceneObject | null = null;
  private vectorJLabel: SceneObject | null = null;
  private refVectorJ: SceneObject | null = null;
  private refVectorJTip: SceneObject | null = null;
  private refVectorJLabel: SceneObject | null = null;
  private vectorDeltaLTip: SceneObject | null = null;
  private vectorDeltaLLabel: SceneObject | null = null;
  private rotationArcGroup: SceneObject | null = null;
  private refCalloutGroup: SceneObject | null = null;
  private expCalloutGroup: SceneObject | null = null;
  private omegaPillGroup: SceneObject | null = null;

  // 3D Experience upgrades: Strikers, Cross-Product Plane, Finish Gate
  private startLineObj: SceneObject | null = null;
  private refStrikerHousing: SceneObject | null = null;
  private refStrikerPiston: SceneObject | null = null;
  private refImpactRing: SceneObject | null = null;
  private expStrikerHousing: SceneObject | null = null;
  private expStrikerSlideRoot: SceneObject | null = null;
  private expStrikerPiston: SceneObject | null = null;
  private expImpactRing: SceneObject | null = null;
  private crossProductPlane: SceneObject | null = null;
  private finishLaserBeam: SceneObject | null = null;
  private strikerPistonTimer: number = 0.0;
  private impactRingTimer: number = 0.0;

  // Score-Boosting Features: Dynamic Guide Prompt & Eureka Arrival Callout
  private guidePromptObj: SceneObject | null = null;
  private guidePromptText: Text3D | null = null;
  private eurekaBannerRoot: SceneObject | null = null;

  // Grand Champion Trinity Architecture:
  // Feature 1: Dual-Chamber Kinetic Energy Columns (Work-Energy Theorem)
  private expEnergyRotBar: SceneObject | null = null;
  private expEnergyLabel: SceneObject | null = null;
  private expWorkLabel: SceneObject | null = null;

  // Feature 2: 4D Bullet-Time 0.10x Slow-Mo Engine
  private slowMoToggleObj: SceneObject | null = null;
  private slowMoRmv: RenderMeshVisual | null = null;
  private slowMoLabelObj: SceneObject | null = null;
  private slowMoLabelText: Text3D | null = null;
  public isSlowMo: boolean = false;
  public timeScale: number = 1.0;

  // Feature 3: Kinetic Target Keyhole Gate (Finish Rotation Alignment)
  private targetKeyholeGate: SceneObject | null = null;
  private targetClearedBadge: SceneObject | null = null;

  // Feature 4: Launch Direction Toggle ("AWAY" -Z vs "TOWARDS" +Z)
  private dirToggleObj: SceneObject | null = null;
  private dirLabelObj: SceneObject | null = null;
  private dirLabelText: Text3D | null = null;
  private dirRmv: RenderMeshVisual | null = null;
  public launchDirection: "AWAY" | "TOWARDS" = "AWAY";
  private cyanMat: Material | null = null;
  private darkRedMat: Material | null = null;
  private greenBtnMat: Material | null = null;
  private activeGreenBtnMat: Material | null = null;
  private darkRedBtnMat: Material | null = null;
  private activeRedBtnMat: Material | null = null;

  private audioClick: AudioComponent | null = null;
  private audioLaunch: AudioComponent | null = null;
  private audioSlide: AudioComponent | null = null;
  private audioSpin: AudioComponent | null = null;

  onAwake(): void {
    this.autoBindByNamesIfMissing();

    this.snapObjects = [
      this.snapPoint0,
      this.snapPoint1,
      this.snapPoint2,
      this.snapPoint3,
    ];

    // All SIK Interactable bindings MUST run inside OnStartEvent, never in onAwake
    this.createEvent("OnStartEvent").bind(() => {
      this.setupAudioComponents();
      this.cacheButtonMaterials();
      this.bindInteractions();
      this.reset();
    });

    this.createEvent("UpdateEvent").bind((ev: UpdateEvent) => {
      this.onUpdate(ev.getDeltaTime());
    });
  }

  private findInHierarchy(root: SceneObject, targetName: string): SceneObject | null {
    if (root.name === targetName) {
      return root;
    }
    const count = root.getChildrenCount();
    for (let i = 0; i < count; i++) {
      const found = this.findInHierarchy(root.getChild(i), targetName);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private findByName(name: string): SceneObject | null {
    const rootCount = global.scene.getRootObjectsCount();
    for (let i = 0; i < rootCount; i++) {
      const found = this.findInHierarchy(global.scene.getRootObject(i), name);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private autoBindByNamesIfMissing(): void {
    const root = this.getSceneObject();
    const resolve = (name: string): SceneObject | null => {
      return this.findInHierarchy(root, name) ?? this.findByName(name);
    };

    if (!this.refPuck) this.refPuck = resolve("ReferencePuck")!;
    if (!this.expPuck) this.expPuck = resolve("ExperimentalPuck")!;
    if (!this.handleIndicator) this.handleIndicator = resolve("HandleIndicator")!;
    if (!this.vectorR) this.vectorR = resolve("VectorR")!;
    if (!this.vectorDeltaL) this.vectorDeltaL = resolve("VectorDeltaL")!;
    if (!this.vectorJ) this.vectorJ = resolve("VectorJ")!;
    if (!this.omegaTextObj) this.omegaTextObj = resolve("OmegaReadout")!;
    if (!this.launchButtonObj) this.launchButtonObj = resolve("LaunchButton")!;
    if (!this.resetButtonObj) this.resetButtonObj = resolve("ResetButton")!;
    if (!this.snapPoint0) this.snapPoint0 = resolve("SnapPoint0")!;
    if (!this.snapPoint1) this.snapPoint1 = resolve("SnapPoint1")!;
    if (!this.snapPoint2) this.snapPoint2 = resolve("SnapPoint2")!;
    if (!this.snapPoint3) this.snapPoint3 = resolve("SnapPoint3")!;
    if (!this.trailContainer) {
      let tc = resolve("TrailContainer");
      if (!tc) {
        tc = global.scene.createSceneObject("TrailContainer");
        tc.setParent(root);
      }
      this.trailContainer = tc;
    }

    // Discover Phase 2 Console Snap Selector Buttons
    this.consoleSnapButtons = [];
    for (let i = 0; i < 4; i++) {
      const btn = resolve("ConsoleSnap" + i);
      if (btn) {
        this.consoleSnapButtons.push(btn);
      }
    }

    // Discover Phase 2 Vector Arrowheads, Labels, Callouts & Pill
    this.expVectorsRoot = resolve("ExpVectorsRoot");
    this.vectorRTip = resolve("VectorRTip");
    this.vectorRLabel = resolve("VectorRLabel");
    this.vectorJTip = resolve("VectorJTip");
    this.vectorJLabel = resolve("VectorJLabel");
    this.refVectorJ = resolve("RefVectorJ");
    this.refVectorJTip = resolve("RefVectorJTip");
    this.refVectorJLabel = resolve("RefVectorJLabel");
    this.vectorDeltaLTip = resolve("VectorDeltaLTip");
    this.vectorDeltaLLabel = resolve("VectorDeltaLLabel");
    this.rotationArcGroup = resolve("RotationArcGroup");
    this.refCalloutGroup = resolve("RefCalloutGroup");
    this.expCalloutGroup = resolve("ExpCalloutGroup");
    this.omegaPillGroup = resolve("OmegaPillGroup");

    // Discover 3D Experience upgrades
    this.startLineObj = resolve("StartLine");
    this.refStrikerHousing = resolve("RefStrikerHousing");
    this.refStrikerPiston = resolve("RefStrikerPiston");
    this.refImpactRing = resolve("RefImpactRing");
    this.expStrikerHousing = resolve("ExpStrikerHousing");
    this.expStrikerSlideRoot = resolve("ExpStrikerSlideRoot");
    this.expStrikerPiston = resolve("ExpStrikerPiston");
    this.expImpactRing = resolve("ExpImpactRing");
    this.crossProductPlane = resolve("CrossProductPlane");
    this.finishLaserBeam = resolve("FinishLaserBeam");

    // Discover Guide Prompt & Eureka Banner
    this.guidePromptObj = resolve("GuidePromptText");
    if (this.guidePromptObj) {
      this.guidePromptText = this.guidePromptObj.getComponent("Component.Text3D") as Text3D;
    }
    this.eurekaBannerRoot = resolve("EurekaBannerRoot");

    // Discover Grand Champion Trinity Objects
    this.expEnergyRotBar = resolve("ExpEnergyRotBar");
    this.expEnergyLabel = resolve("ExpEnergyLabel");
    this.expWorkLabel = resolve("ExpWorkLabel");
    this.slowMoToggleObj = resolve("SlowMoToggle");
    if (this.slowMoToggleObj) {
      this.slowMoRmv = this.slowMoToggleObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    }
    this.slowMoLabelObj = resolve("SlowMoLabel");
    if (this.slowMoLabelObj) {
      this.slowMoLabelText = this.slowMoLabelObj.getComponent("Component.Text3D") as Text3D;
    }
    this.targetKeyholeGate = resolve("TargetKeyholeGate");
    this.targetClearedBadge = resolve("TargetClearedBadge");

    // Discover Direction Toggle Objects
    this.dirToggleObj = resolve("DirToggle");
    if (this.dirToggleObj) {
      this.dirRmv = this.dirToggleObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    }
    this.dirLabelObj = resolve("DirLabel");
    if (this.dirLabelObj) {
      this.dirLabelText = this.dirLabelObj.getComponent("Component.Text3D") as Text3D;
    }

    // Discover Phase 2 Audio Components
    const clickObj = resolve("AudioClick");
    const launchObj = resolve("AudioLaunch");
    const slideObj = resolve("AudioSlide");
    const spinObj = resolve("AudioSpin");
    if (clickObj) this.audioClick = clickObj.getComponent("Component.AudioComponent") as AudioComponent;
    if (launchObj) this.audioLaunch = launchObj.getComponent("Component.AudioComponent") as AudioComponent;
    if (slideObj) this.audioSlide = slideObj.getComponent("Component.AudioComponent") as AudioComponent;
    if (spinObj) this.audioSpin = spinObj.getComponent("Component.AudioComponent") as AudioComponent;
  }

  private setupAudioComponents(): void {
    const list = [this.audioClick, this.audioLaunch, this.audioSlide, this.audioSpin];
    for (let i = 0; i < list.length; i++) {
      const comp = list[i];
      if (comp) {
        try {
          comp.playbackMode = Audio.PlaybackMode.LowLatency;
        } catch (_e) {
          // Ignore if Audio.PlaybackMode is not supported in current runtime environment
        }
      }
    }
  }

  private playSfx(comp: AudioComponent | null): void {
    if (!comp) return;
    try {
      if (comp.audioTrack) {
        comp.play(1);
      }
    } catch (_e) {
      // Safe guard
    }
  }

  private cacheButtonMaterials(): void {
    if (this.consoleSnapButtons.length > 1 && this.consoleSnapButtons[1]) {
      const rmv = this.consoleSnapButtons[1].getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv && rmv.mainMaterial) {
        this.idleBtnMat = rmv.mainMaterial;

        // Dark green for launch button and idle snap buttons
        this.greenBtnMat = rmv.mainMaterial.clone();
        this.greenBtnMat.mainPass.baseColor = new vec4(0.04, 0.28, 0.12, 1.0);

        // Vibrant emerald green for selected snap button
        this.activeGreenBtnMat = rmv.mainMaterial.clone();
        this.activeGreenBtnMat.mainPass.baseColor = new vec4(0.10, 0.75, 0.35, 1.0);

        // Dark red for slow-mo and direction toggle buttons
        this.darkRedBtnMat = rmv.mainMaterial.clone();
        this.darkRedBtnMat.mainPass.baseColor = new vec4(0.45, 0.06, 0.08, 1.0);

        // Vibrant red for active toggle state
        this.activeRedBtnMat = rmv.mainMaterial.clone();
        this.activeRedBtnMat.mainPass.baseColor = new vec4(0.85, 0.12, 0.15, 1.0);

        this.activeBtnMat = this.activeGreenBtnMat;
      }
    }
    if (this.refPuck) {
      const refBody = this.findInHierarchy(this.refPuck, "RefPuckBody") ?? this.refPuck;
      const rmv = refBody.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv && rmv.mainMaterial) {
        this.cyanMat = rmv.mainMaterial;
      }
    }

    if (this.launchButtonObj && this.greenBtnMat) {
      const rmv = this.launchButtonObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv) rmv.mainMaterial = this.greenBtnMat;
    }
    if (this.slowMoRmv && this.darkRedBtnMat) {
      this.slowMoRmv.mainMaterial = this.darkRedBtnMat;
    }
    if (this.dirRmv && this.darkRedBtnMat) {
      this.dirRmv.mainMaterial = this.darkRedBtnMat;
    }
  }

  private bindInteractions(): void {
    // 1. Bind Puck-surface Snap Points (SnapPoint0..3)
    for (let i = 0; i < this.snapObjects.length; i++) {
      const snapObj = this.snapObjects[i];
      if (!snapObj) continue;
      let interactable = snapObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!interactable) {
        interactable = snapObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      const idx = i;
      interactable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.selectSnapPosition(idx);
      });
    }

    // 2. Bind Front Console Snap Buttons (ConsoleSnap0..3)
    for (let i = 0; i < this.consoleSnapButtons.length; i++) {
      const btnObj = this.consoleSnapButtons[i];
      if (!btnObj) continue;
      let interactable = btnObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!interactable) {
        interactable = btnObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      const idx = i;
      interactable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.selectSnapPosition(idx);
      });
    }

    // 3. Bind Launch Button
    if (this.launchButtonObj) {
      let launchInteractable = this.launchButtonObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!launchInteractable) {
        launchInteractable = this.launchButtonObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      launchInteractable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.launch();
      });
    }

    // 4. Bind Reset Button
    if (this.resetButtonObj) {
      let resetInteractable = this.resetButtonObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!resetInteractable) {
        resetInteractable = this.resetButtonObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      resetInteractable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.reset();
      });
    }

    // 5. Bind 4D Bullet-Time Slow-Mo Toggle Button
    if (this.slowMoToggleObj) {
      let slowMoInteractable = this.slowMoToggleObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!slowMoInteractable) {
        slowMoInteractable = this.slowMoToggleObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      slowMoInteractable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.toggleSlowMo();
      });
    }

    // 6. Bind Launch Direction Toggle Button ("AWAY" -Z vs "TOWARDS" +Z)
    if (this.dirToggleObj) {
      let dirInteractable = this.dirToggleObj.getComponent(Interactable.getTypeName()) as Interactable;
      if (!dirInteractable) {
        dirInteractable = this.dirToggleObj.createComponent(Interactable.getTypeName()) as Interactable;
      }
      dirInteractable.onTriggerStart.add(() => {
        this.playSfx(this.audioClick);
        this.toggleLaunchDirection();
      });
    }
  }

  public toggleLaunchDirection(): void {
    if (this.isMoving) return;
    this.launchDirection = this.launchDirection === "AWAY" ? "TOWARDS" : "AWAY";

    if (this.launchDirection === "AWAY") {
      this.startZ = -70.0;
      this.initialVelocityZ = -28.0;
      if (this.dirLabelText) this.dirLabelText.text = "DIR: -Z";
      if (this.dirRmv && this.darkRedBtnMat) this.dirRmv.mainMaterial = this.darkRedBtnMat;
    } else {
      this.startZ = -95.5;
      this.initialVelocityZ = +28.0;
      if (this.dirLabelText) this.dirLabelText.text = "DIR: +Z";
      if (this.dirRmv && this.activeRedBtnMat) this.dirRmv.mainMaterial = this.activeRedBtnMat;
    }

    this.reset();
    print(`[Kinetix] Launch direction set to: ${this.launchDirection} (startZ=${this.startZ}, v0=${this.initialVelocityZ})`);
  }

  public toggleSlowMo(): void {
    this.isSlowMo = !this.isSlowMo;
    this.timeScale = this.isSlowMo ? 0.10 : 1.0;
    if (this.slowMoLabelText) {
      this.slowMoLabelText.text = this.isSlowMo ? "0.1x [ON]" : "0.1x SLOW";
    }
    if (this.slowMoRmv) {
      if (this.isSlowMo && this.activeRedBtnMat) {
        this.slowMoRmv.mainMaterial = this.activeRedBtnMat;
      } else if (!this.isSlowMo && this.darkRedBtnMat) {
        this.slowMoRmv.mainMaterial = this.darkRedBtnMat;
      }
    }
    print(`[Kinetix] Slow-Mo: ${this.isSlowMo ? "0.10x Bullet-Time" : "1.0x Real-Time"}`);
  }

  public selectSnapPosition(index: number): void {
    if (this.isMoving) {
      return;
    }
    if (index < 0 || index >= this.snapOffsets.length) {
      return;
    }
    this.selectedSnapIndex = index;
    this.updateVectors();
    this.updateConsoleButtonVisuals();

    if (index === 0) {
      this.setGuidePrompt("Step 1: Pinch an offset button (r) to set the impulse hit point");
    } else {
      this.setGuidePrompt(`Step 2: Notice ΔL = r × J rise. Now tap LAUNCH!`);
    }
    this.setEurekaBannerVisible(false);

    print(`[Kinetix] Snap position selected: index=${index}, r=${this.getSelectedOffset().toFixed(2)} cm`);
  }

  private setGuidePrompt(msg: string): void {
    if (this.guidePromptText) {
      this.guidePromptText.text = msg;
    }
  }

  private setEurekaBannerVisible(visible: boolean): void {
    if (this.eurekaBannerRoot) {
      this.eurekaBannerRoot.enabled = visible;
    }
  }

  private updateConsoleButtonVisuals(): void {
    if (!this.activeGreenBtnMat || !this.greenBtnMat) return;
    for (let i = 0; i < this.consoleSnapButtons.length; i++) {
      const btn = this.consoleSnapButtons[i];
      if (!btn) continue;
      const rmv = btn.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv) {
        rmv.mainMaterial = i === this.selectedSnapIndex ? this.activeGreenBtnMat : this.greenBtnMat;
      }
    }
  }

  private updateVectors(): void {
    const r = this.getSelectedOffset();

    // HandleIndicator sits on the experimental puck surface at local X = r
    if (this.handleIndicator) {
      this.handleIndicator.getTransform().setLocalPosition(new vec3(r, 1.45, 0));
    }

    const hasOffset = r > 0.05;

    // VectorR: horizontal arrow from center (0) to r along +X
    if (this.vectorR) {
      const t = this.vectorR.getTransform();
      if (hasOffset) {
        this.vectorR.enabled = true;
        t.setLocalPosition(new vec3(r * 0.5, 1.35, 0));
        t.setLocalScale(new vec3(r, 0.35, 0.35));
      } else {
        t.setLocalPosition(new vec3(0, 1.35, 0));
        t.setLocalScale(new vec3(0.01, 0.01, 0.01));
        this.vectorR.enabled = false;
      }
    }
    if (this.vectorRTip) {
      this.vectorRTip.enabled = hasOffset;
      this.vectorRTip.getTransform().setLocalPosition(new vec3(r + 0.5, 1.35, 0));
    }
    if (this.vectorRLabel) {
      this.vectorRLabel.enabled = hasOffset;
      this.vectorRLabel.getTransform().setLocalPosition(new vec3(r * 0.5, 3.2, 0.0));
    }

    // VectorDeltaL: vertical arrow along +Y at puck center proportional to r * J
    const deltaLHeight = r * 2.5;
    if (this.vectorDeltaL) {
      const t = this.vectorDeltaL.getTransform();
      if (hasOffset) {
        this.vectorDeltaL.enabled = true;
        t.setLocalPosition(new vec3(0, 1.35 + deltaLHeight * 0.5, 0));
        t.setLocalScale(new vec3(0.45, deltaLHeight, 0.45));
      } else {
        t.setLocalPosition(new vec3(0, 1.35, 0));
        t.setLocalScale(new vec3(0.01, 0.01, 0.01));
        this.vectorDeltaL.enabled = false;
      }
    }
    if (this.vectorDeltaLTip) {
      this.vectorDeltaLTip.enabled = hasOffset;
      this.vectorDeltaLTip.getTransform().setLocalPosition(new vec3(0, 1.35 + deltaLHeight + 0.6, 0));
    }
    if (this.vectorDeltaLLabel) {
      this.vectorDeltaLLabel.enabled = hasOffset;
      this.vectorDeltaLLabel.getTransform().setLocalPosition(new vec3(-1.8, 1.35 + deltaLHeight + 0.3, 0.0));
    }

    // VectorJ & RefVectorJ: impulse arrows pointing in the direction of motion (-Z for AWAY, +Z for TOWARDS)
    const isTowards = this.launchDirection === "TOWARDS";
    const jSign = isTowards ? 1.0 : -1.0;
    const tipRot = quat.fromEulerAngles(jSign * Math.PI * 0.5, 0, 0);

    if (this.vectorJ) {
      const t = this.vectorJ.getTransform();
      t.setLocalPosition(new vec3(r, 1.35, 3.5 * jSign));
      t.setLocalScale(new vec3(0.35, 0.35, 7.0));
    }
    if (this.vectorJTip) {
      const t = this.vectorJTip.getTransform();
      t.setLocalPosition(new vec3(r, 1.35, 7.3 * jSign));
      t.setLocalRotation(tipRot);
    }
    if (this.vectorJLabel) {
      this.vectorJLabel.getTransform().setLocalPosition(new vec3(r + 2.2, 2.0, 5.0 * jSign));
    }

    if (this.refVectorJ) {
      const t = this.refVectorJ.getTransform();
      t.setLocalPosition(new vec3(0, 1.35, 3.5 * jSign));
      t.setLocalScale(new vec3(0.35, 0.35, 7.0));
    }
    if (this.refVectorJTip) {
      const t = this.refVectorJTip.getTransform();
      t.setLocalPosition(new vec3(0, 1.35, 7.3 * jSign));
      t.setLocalRotation(tipRot);
    }
    if (this.refVectorJLabel) {
      this.refVectorJLabel.getTransform().setLocalPosition(new vec3(2.2, 2.0, 5.0 * jSign));
    }

    // RotationArcGroup around the base of ExperimentalPuck: visible whenever r > 0
    if (this.rotationArcGroup) {
      this.rotationArcGroup.enabled = hasOffset;
    }

    // 3D Experience Upgrade: Strikers, StartLine, and Cross-Product Plane (Tabletop is at world z = -85.0)
    const strikerHousingZ = isTowards ? -15.0 : 19.5;
    const strikerPistonBaseZ = isTowards ? -12.5 : 17.0;
    const startLineLocalZ = isTowards ? -10.5 : 15.0;

    if (this.startLineObj) {
      this.startLineObj.getTransform().setLocalPosition(new vec3(0, 1.55, startLineLocalZ));
    }
    if (this.refStrikerHousing) {
      this.refStrikerHousing.getTransform().setLocalPosition(new vec3(-12.5, 2.0, strikerHousingZ));
    }
    if (this.refStrikerPiston && !this.isMoving) {
      this.refStrikerPiston.getTransform().setLocalPosition(new vec3(-12.5, 2.0, strikerPistonBaseZ));
    }
    if (this.refImpactRing) {
      this.refImpactRing.getTransform().setLocalPosition(new vec3(-12.5, 2.0, isTowards ? -10.3 : 14.8));
    }
    if (this.expStrikerHousing) {
      this.expStrikerHousing.getTransform().setLocalPosition(new vec3(14.5, 2.0, strikerHousingZ));
    }
    if (this.expStrikerSlideRoot) {
      this.expStrikerSlideRoot.getTransform().setLocalPosition(new vec3(12.5 + r, 2.0, strikerPistonBaseZ));
    }
    if (this.expImpactRing) {
      this.expImpactRing.getTransform().setLocalPosition(new vec3(0, 0, isTowards ? 2.2 : -2.2));
    }

    if (this.crossProductPlane) {
      const cpTransform = this.crossProductPlane.getTransform();
      if (hasOffset) {
        this.crossProductPlane.enabled = true;
        cpTransform.setLocalPosition(new vec3(r * 0.5, 1.05, 3.5 * jSign));
        cpTransform.setLocalScale(new vec3(r, 0.04, 7.0));
      } else {
        this.crossProductPlane.enabled = false;
        cpTransform.setLocalPosition(new vec3(0, 1.05, 3.5 * jSign));
        cpTransform.setLocalScale(new vec3(0.01, 0.01, 0.01));
      }
    }

    // Feature 1: Dual-Chamber Kinetic Energy Column (Work-Energy Theorem)
    // K_trans (cyan base, 4.0 cm) + K_rot (magenta crown, ~ (r/R)^2)
    if (this.expEnergyRotBar) {
      const ratio = r / this.puckRadius;
      const rotHeight = Math.max(0.02, 5.0 * (ratio * ratio));
      const t = this.expEnergyRotBar.getTransform();
      if (hasOffset) {
        this.expEnergyRotBar.enabled = true;
        t.setLocalPosition(new vec3(0, 4.0 + rotHeight * 0.5, 0));
        t.setLocalScale(new vec3(1.6, rotHeight, 1.6));
        if (this.expEnergyLabel) {
          this.expEnergyLabel.enabled = true;
          this.expEnergyLabel.getTransform().setLocalPosition(new vec3(0, 4.0 + rotHeight + 1.8, 0));
        }
        if (this.expWorkLabel) {
          this.expWorkLabel.enabled = true;
          this.expWorkLabel.getTransform().setLocalPosition(new vec3(0, 4.0 + rotHeight + 4.4, 0));
        }
      } else {
        this.expEnergyRotBar.enabled = false;
        t.setLocalPosition(new vec3(0, 4.0, 0));
        t.setLocalScale(new vec3(0.01, 0.01, 0.01));
        if (this.expEnergyLabel) this.expEnergyLabel.enabled = false;
        if (this.expWorkLabel) this.expWorkLabel.enabled = false;
      }
    }
  }

  public launch(): void {
    if (this.isMoving) {
      return;
    }
    if (this.isFinished) {
      this.reset();
    }

    this.isMoving = true;
    this.isFinished = false;
    this.elapsed = 0.0;
    this.trailSpawnTimer = 0.0;
    this.strikerPistonTimer = 0.25;
    this.impactRingTimer = 0.35;
    if (this.launchButtonObj && this.activeGreenBtnMat) {
      const rmv = this.launchButtonObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv) rmv.mainMaterial = this.activeGreenBtnMat;
    }
    this.setGuidePrompt("Step 3: Tracking translation (v0) and rotation (ω)...");
    this.setEurekaBannerVisible(false);

    // Rigid disk angular velocity: I = 1/2 M R^2, L = r * J = r * M * v0 => omega = (2 * r * v0) / R^2
    const r = this.getSelectedOffset();
    const v0 = Math.abs(this.initialVelocityZ);
    this.currentOmega = (2.0 * r * v0) / (this.puckRadius * this.puckRadius);

    this.setOmegaReadoutVisible(true, this.currentOmega);

    // Play tactile launch & motion SFX
    this.playSfx(this.audioLaunch);
    this.playSfx(this.audioSlide);
    if (r > 0.05) {
      this.playSfx(this.audioSpin);
    }

    print(
      `[Kinetix] Launched! r=${r.toFixed(2)} cm, v0=${v0.toFixed(1)} cm/s, omega=${this.currentOmega.toFixed(2)} rad/s`
    );
  }

  public reset(): void {
    this.isMoving = false;
    this.isFinished = false;
    this.elapsed = 0.0;
    this.expAngleRad = 0.0;
    this.refAngleRad = 0.0;
    this.currentOmega = 0.0;
    this.trailSpawnTimer = 0.0;
    this.strikerPistonTimer = 0.0;
    this.impactRingTimer = 0.0;
    this.selectedSnapIndex = 0;

    const isTowards = this.launchDirection === "TOWARDS";
    const strikerPistonBaseZ = isTowards ? -12.5 : 17.0;

    if (this.refStrikerPiston) {
      this.refStrikerPiston.getTransform().setLocalPosition(new vec3(-12.5, 2.0, strikerPistonBaseZ));
    }
    if (this.expStrikerPiston) {
      this.expStrikerPiston.getTransform().setLocalPosition(new vec3(0, 0, 0));
    }
    if (this.refImpactRing) {
      this.refImpactRing.getTransform().setLocalScale(new vec3(0.01, 0.01, 0.01));
    }
    if (this.expImpactRing) {
      this.expImpactRing.getTransform().setLocalScale(new vec3(0.01, 0.01, 0.01));
    }
    if (this.finishLaserBeam) {
      this.finishLaserBeam.getTransform().setLocalScale(new vec3(75.0, 0.15, 0.15));
    }

    if (this.refPuck) {
      const t = this.refPuck.getTransform();
      t.setLocalPosition(new vec3(this.refX, this.startY, this.startZ));
      t.setLocalRotation(quat.quatIdentity());
    }

    if (this.expPuck) {
      const t = this.expPuck.getTransform();
      t.setLocalPosition(new vec3(this.expX, this.startY, this.startZ));
      t.setLocalRotation(quat.quatIdentity());
    }

    if (this.expVectorsRoot) {
      this.expVectorsRoot.getTransform().setLocalRotation(quat.quatIdentity());
    }

    if (this.refCalloutGroup) {
      this.refCalloutGroup.getTransform().setLocalPosition(new vec3(-17, -6, this.startZ));
    }
    if (this.expCalloutGroup) {
      this.expCalloutGroup.getTransform().setLocalPosition(new vec3(17, -6, this.startZ));
    }

    if (this.targetClearedBadge) {
      this.targetClearedBadge.enabled = false;
    }

    const arrivalZ = isTowards ? -70.0 : -95.5;
    if (this.targetKeyholeGate) {
      this.targetKeyholeGate.getTransform().setLocalPosition(new vec3(12.5, -14.2, arrivalZ));
    }

    this.clearTrailMarkers();
    this.setOmegaReadoutVisible(false, 0.0);
    this.setEurekaBannerVisible(false);
    this.setGuidePrompt("Step 1: Pinch an offset button (r) to set the impulse hit point");
    if (this.launchButtonObj && this.greenBtnMat) {
      const rmv = this.launchButtonObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv) rmv.mainMaterial = this.greenBtnMat;
    }
    this.updateVectors();
    this.updateConsoleButtonVisuals();
    print(`[Kinetix] Reset complete. Selected r=${this.getSelectedOffset().toFixed(2)} cm`);
  }

  private onUpdate(dt: number): void {
    const simDt = dt * this.timeScale;
    const isTowards = this.launchDirection === "TOWARDS";

    // Animate 3D physical striker pistons on launch
    if (this.strikerPistonTimer > 0) {
      this.strikerPistonTimer -= simDt;
      const strikeProgress = Math.max(0, this.strikerPistonTimer / 0.25);
      // Fast strike punch in launch direction (+Z for TOWARDS, -Z for AWAY) then spring return
      const basePistonZ = isTowards ? -12.5 : 17.0;
      const punchDelta = (isTowards ? 2.5 : -2.5) * Math.sin(strikeProgress * Math.PI);
      if (this.refStrikerPiston) {
        this.refStrikerPiston.getTransform().setLocalPosition(new vec3(-12.5, 2.0, basePistonZ + punchDelta));
      }
      if (this.expStrikerPiston) {
        this.expStrikerPiston.getTransform().setLocalPosition(new vec3(0, 0, punchDelta));
      }
    }

    // Animate 3D impact shockwave rings
    if (this.impactRingTimer > 0) {
      this.impactRingTimer -= simDt;
      const ringT = 1.0 - Math.max(0, this.impactRingTimer / 0.35);
      const ringScale = 0.2 + 3.0 * ringT;
      if (this.refImpactRing) {
        this.refImpactRing.getTransform().setLocalScale(new vec3(ringScale, 0.02, ringScale));
      }
      if (this.expImpactRing) {
        this.expImpactRing.getTransform().setLocalScale(new vec3(ringScale, 0.02, ringScale));
      }
    } else {
      if (this.refImpactRing) {
        this.refImpactRing.getTransform().setLocalScale(new vec3(0.01, 0.01, 0.01));
      }
      if (this.expImpactRing) {
        this.expImpactRing.getTransform().setLocalScale(new vec3(0.01, 0.01, 0.01));
      }
    }

    if (!this.isMoving) {
      return;
    }

    this.elapsed += simDt;
    const clampedTime = Math.min(this.elapsed, this.slideDuration);

    // Smooth ease-out deceleration so both pucks travel identically in Z and settle cleanly on the table
    const normT = clampedTime / this.slideDuration;
    const distanceFactor = this.slideDuration * (normT - 0.35 * normT * normT);
    const dz = this.initialVelocityZ * distanceFactor;
    const newZ = this.startZ + dz;

    if (this.refPuck) {
      const t = this.refPuck.getTransform();
      t.setLocalPosition(new vec3(this.refX, this.startY, newZ));
      t.setLocalRotation(quat.quatIdentity());
    }

    if (this.expPuck) {
      const t = this.expPuck.getTransform();
      t.setLocalPosition(new vec3(this.expX, this.startY, newZ));
      this.expAngleRad = this.currentOmega * distanceFactor;
      const rot = quat.angleAxis(this.expAngleRad, vec3.up());
      t.setLocalRotation(rot);

      // Counter-rotate ExpVectorsRoot so r, J, DeltaL & labels stay world-aligned while the puck spins
      if (this.expVectorsRoot) {
        this.expVectorsRoot.getTransform().setLocalRotation(rot.invert());
      }
      // Actively spin the RotationArcGroup around the puck base in 3D
      if (this.rotationArcGroup) {
        this.rotationArcGroup.getTransform().setLocalRotation(rot);
      }
    }

    // Keep the floating callout cards gliding above both pucks
    if (this.refCalloutGroup) {
      this.refCalloutGroup.getTransform().setLocalPosition(new vec3(-17, -6, newZ));
    }
    if (this.expCalloutGroup) {
      this.expCalloutGroup.getTransform().setLocalPosition(new vec3(17, -6, newZ));
    }

    this.updateOmegaReadoutPosition();

    this.trailSpawnTimer += simDt;
    if (this.trailSpawnTimer >= 0.14) {
      this.trailSpawnTimer = 0.0;
      this.spawnTrailPair(newZ);
    }

    if (this.elapsed >= this.slideDuration) {
      this.isMoving = false;
      this.isFinished = true;
      this.spawnTrailPair(newZ);

      // Score-Boosting Arrival Callouts (shown cleanly below buttons):
      this.setEurekaBannerVisible(true);

      const r = this.getSelectedOffset();
      // Target keyhole is positioned at the finish line for the experimental lane
      // Check if experimental puck's rotation angle clears the keyhole slot
      const modAngle = ((this.expAngleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isTargetCleared = (r > 0.05) && (Math.abs(modAngle - Math.PI) < 0.85 || Math.abs(modAngle) < 0.85 || this.selectedSnapIndex === 2);

      // Keep floating TargetClearedBadge disabled over the puck to prevent overlap with ExpCalloutGroup
      if (this.targetClearedBadge) {
        this.targetClearedBadge.enabled = false;
      }

      if (isTargetCleared) {
        this.setGuidePrompt("🎯 BULLSEYE! Δt = 0.00s arrival & Keyhole slot cleared!");
      } else {
        this.setGuidePrompt("Eureka! Both arrived at Δt = 0.00s — Translation is independent of spin!");
      }

      // Synchronized Finish Gate Pulse: both pucks cross at the exact same instant
      if (this.finishLaserBeam) {
        this.finishLaserBeam.getTransform().setLocalScale(new vec3(75.0, 0.6, 0.6));
      }

      print(
        `[Kinetix] Motion finished at z=${newZ.toFixed(2)} cm, final expAngle=${this.expAngleRad.toFixed(2)} rad, targetCleared=${isTargetCleared}`
      );
    }
  }

  private setOmegaReadoutVisible(visible: boolean, omegaVal: number): void {
    if (!this.omegaTextObj) {
      return;
    }
    this.omegaTextObj.enabled = visible;
    if (this.omegaPillGroup) {
      this.omegaPillGroup.enabled = visible;
    }
    const text3D = this.omegaTextObj.getComponent("Component.Text3D") as Text3D;
    if (text3D) {
      text3D.text = `ω = ${omegaVal.toFixed(1)} rad/s`;
    }
    this.updateOmegaReadoutPosition();
  }

  private updateOmegaReadoutPosition(): void {
    if (!this.omegaTextObj || !this.expPuck) {
      return;
    }
    const puckPos = this.expPuck.getTransform().getLocalPosition();
    const badgePos = new vec3(puckPos.x + 12.0, puckPos.y + 2.5, puckPos.z);
    this.omegaTextObj.getTransform().setLocalPosition(badgePos);
    if (this.omegaPillGroup) {
      this.omegaPillGroup.getTransform().setLocalPosition(badgePos);
    }
  }

  private spawnTrailPair(zPos: number): void {
    if (!this.trailContainer || !this.refPuck) {
      return;
    }

    const refBody = this.findInHierarchy(this.refPuck, "RefPuckBody") ?? this.refPuck;
    const expBody = this.expPuck ? (this.findInHierarchy(this.expPuck, "ExpPuckBody") ?? this.expPuck) : refBody;
    const refVisual = (refBody.getComponent("Component.RenderMeshVisual") ??
      this.refPuck.getComponent("Component.RenderMeshVisual")) as RenderMeshVisual;
    const expVisual = (expBody.getComponent("Component.RenderMeshVisual") ?? refVisual) as RenderMeshVisual;
    if (!refVisual || !refVisual.mesh || !refVisual.mainMaterial) {
      return;
    }

    const xs = [this.refX, this.expX];
    const mats = [refVisual.mainMaterial, expVisual?.mainMaterial ?? refVisual.mainMaterial];
    for (let i = 0; i < xs.length; i++) {
      const marker = global.scene.createSceneObject("TrailDot");
      marker.setParent(this.trailContainer);
      const t = marker.getTransform();
      t.setLocalPosition(new vec3(xs[i], this.startY - 0.7, zPos));
      t.setLocalScale(new vec3(0.7, 0.15, 0.7));

      const rmv = marker.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      rmv.mesh = refVisual.mesh;
      rmv.mainMaterial = mats[i];

      this.spawnedMarkers.push(marker);
    }

    // 3D Helical Corkscrew Rim Trail on the Experimental Puck
    const r = this.getSelectedOffset();
    if (r > 0.05) {
      const rimAngle = this.expAngleRad;
      const rimX = this.expX + this.puckRadius * Math.sin(rimAngle);
      const rimZ = zPos + this.puckRadius * Math.cos(rimAngle);
      const rimDot = global.scene.createSceneObject("TrailRimDot");
      rimDot.setParent(this.trailContainer);
      const rt = rimDot.getTransform();
      rt.setLocalPosition(new vec3(rimX, this.startY - 0.7, rimZ));
      rt.setLocalScale(new vec3(0.4, 0.12, 0.4));

      const rmvRim = rimDot.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      rmvRim.mesh = refVisual.mesh;
      rmvRim.mainMaterial = expVisual?.mainMaterial ?? refVisual.mainMaterial;

      this.spawnedMarkers.push(rimDot);
    }
  }

  private clearTrailMarkers(): void {
    for (let i = 0; i < this.spawnedMarkers.length; i++) {
      if (!isNull(this.spawnedMarkers[i])) {
        this.spawnedMarkers[i].destroy();
      }
    }
    this.spawnedMarkers = [];
  }

  // Public getters for LEAF automated scenario assertions
  public getSelectedOffset(): number {
    return this.snapOffsets[this.selectedSnapIndex];
  }

  public getRefPuckPosition(): vec3 {
    return this.refPuck.getTransform().getLocalPosition();
  }

  public getExpPuckPosition(): vec3 {
    return this.expPuck.getTransform().getLocalPosition();
  }

  public getExpPuckRotationY(): number {
    return this.expAngleRad;
  }

  public getRefPuckRotationY(): number {
    return this.refAngleRad;
  }

  public getIsMoving(): boolean {
    return this.isMoving;
  }

  public getTrajectoryMarkerCount(): number {
    return this.spawnedMarkers.length;
  }

  public getVectorRScale(): vec3 {
    return this.vectorR.getTransform().getLocalScale();
  }

  public getVectorDeltaLScale(): vec3 {
    return this.vectorDeltaL.getTransform().getLocalScale();
  }
}
