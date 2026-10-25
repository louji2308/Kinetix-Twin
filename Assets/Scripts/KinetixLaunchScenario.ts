import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { KinetixExperiment } from "./KinetixExperiment";

@component
export class KinetixLaunchScenario extends Scenario {
    async run(): Promise<void> {
        print("[LEAF] Starting Scenario: KinetixLaunchScenario (Done Criterion 2)");
        await sleep(500);

        const apparatusObj = findSceneObjectByName("KinetixApparatus");
        expect(apparatusObj).not.toBeNull();
        const experiment = apparatusObj.getComponent(KinetixExperiment.getTypeName()) as KinetixExperiment;
        expect(experiment).not.toBeNull();

        const interactor = new DefaultLeafInteractor();

        // 1. Select edge snap point (r = 3.8 cm) so rotation will be maximum
        const snapPoint3 = findInteractableByName("SnapPoint3");
        expect(snapPoint3).not.toBeNull();
        await interactor.trigger(snapPoint3);
        await sleep(200);

        const initialRefPos = experiment.getRefPuckPosition();
        const initialExpPos = experiment.getExpPuckPosition();

        // 2. Pinch the Launch button
        const launchBtn = findInteractableByName("LaunchButton");
        expect(launchBtn).not.toBeNull();
        await interactor.trigger(launchBtn);

        // 3. Wait for pucks to fire and complete flight (~2.0 seconds)
        await sleep(2200);

        // 4. Assert both pucks moved forward along -Z (Z became more negative)
        const finalRefPos = experiment.getRefPuckPosition();
        const finalExpPos = experiment.getExpPuckPosition();

        expect(finalRefPos.z).toBeLessThan(initialRefPos.z - 10.0);
        expect(finalExpPos.z).toBeLessThan(initialExpPos.z - 10.0);

        // 5. Assert reference puck slides straight with 0 spin
        expect(experiment.getRefPuckRotationY()).toBe(0.0);

        // 6. Assert experimental puck visibly rotated (> 2.0 radians / over 110 degrees)
        const expRot = experiment.getExpPuckRotationY();
        expect(Math.abs(expRot)).toBeGreaterThan(2.0);

        // 7. Assert trajectory markers were dropped
        expect(experiment.getTrajectoryMarkerCount()).toBeGreaterThan(5);

        print(`[LEAF] KinetixLaunchScenario PASSED! (Exp rotation: ${expRot.toFixed(2)} rad, Trajectory dots: ${experiment.getTrajectoryMarkerCount()})`);
    }
}
