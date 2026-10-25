import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { KinetixExperiment } from "./KinetixExperiment";

@component
export class KinetixResetAndRepeatScenario extends Scenario {
    async run(): Promise<void> {
        print("[LEAF] Starting Scenario: KinetixResetAndRepeatScenario (Done Criterion 4)");
        await sleep(500);

        const apparatusObj = findSceneObjectByName("KinetixApparatus");
        expect(apparatusObj).not.toBeNull();
        const experiment = apparatusObj.getComponent(KinetixExperiment.getTypeName()) as KinetixExperiment;
        expect(experiment).not.toBeNull();

        const interactor = new DefaultLeafInteractor();

        // 1. Pinch Reset button
        const resetBtn = findInteractableByName("ResetButton");
        expect(resetBtn).not.toBeNull();
        await interactor.trigger(resetBtn);
        await sleep(400);

        // 2. Assert both pucks returned to start Z (-70.0 cm)
        const refPos = experiment.getRefPuckPosition();
        const expPos = experiment.getExpPuckPosition();
        expect(refPos.z).toBeCloseTo(-70.0, 1);
        expect(expPos.z).toBeCloseTo(-70.0, 1);

        // 3. Assert rotations reset to zero
        expect(experiment.getRefPuckRotationY()).toBe(0.0);
        expect(experiment.getExpPuckRotationY()).toBe(0.0);

        // 4. Assert handle returned to center (index 0, offset 0.0)
        expect(experiment.selectedSnapIndex).toBe(0);
        expect(experiment.getSelectedOffset()).toBe(0.0);

        // 5. Assert trajectory trails cleared
        expect(experiment.getTrajectoryMarkerCount()).toBe(0);

        // 6. Repeat with a DIFFERENT offset: SnapPoint2 (1/2 radius: r = 2.0 cm)
        const snapPoint2 = findInteractableByName("SnapPoint2");
        expect(snapPoint2).not.toBeNull();
        await interactor.trigger(snapPoint2);
        await sleep(200);

        expect(experiment.selectedSnapIndex).toBe(2);
        expect(experiment.getSelectedOffset()).toBeCloseTo(2.0, 1);

        // Launch again
        const launchBtn = findInteractableByName("LaunchButton");
        await interactor.trigger(launchBtn);
        await sleep(2200);

        // Verify rotation is consistent and non-zero
        const expRot2 = experiment.getExpPuckRotationY();
        expect(Math.abs(expRot2)).toBeGreaterThan(1.0);
        expect(experiment.getTrajectoryMarkerCount()).toBeGreaterThan(5);

        print(`[LEAF] KinetixResetAndRepeatScenario PASSED! (Repeated at r=2.0cm, Exp rotation: ${expRot2.toFixed(2)} rad)`);
    }
}
