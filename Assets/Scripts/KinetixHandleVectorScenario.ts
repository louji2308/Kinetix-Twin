import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { KinetixExperiment } from "./KinetixExperiment";

@component
export class KinetixHandleVectorScenario extends Scenario {
    async run(): Promise<void> {
        print("[LEAF] Starting Scenario: KinetixHandleVectorScenario (Done Criterion 1)");
        await sleep(500);

        // 1. Locate the experiment apparatus
        const apparatusObj = findSceneObjectByName("KinetixApparatus");
        expect(apparatusObj).not.toBeNull();
        const experiment = apparatusObj.getComponent(KinetixExperiment.getTypeName()) as KinetixExperiment;
        expect(experiment).not.toBeNull();

        // 2. Initial state: Handle at Center (index 0, offset 0.0)
        expect(experiment.selectedSnapIndex).toBe(0);
        expect(experiment.getSelectedOffset()).toBe(0.0);

        const interactor = new DefaultLeafInteractor();

        // 3. Pinch SnapPoint3 (Edge position: r = 3.8 cm)
        const snapPoint3 = findInteractableByName("SnapPoint3");
        expect(snapPoint3).not.toBeNull();
        await interactor.trigger(snapPoint3);
        await sleep(300);

        // 4. Assert handle updated to Edge
        expect(experiment.selectedSnapIndex).toBe(3);
        expect(experiment.getSelectedOffset()).toBeCloseTo(3.8, 1);

        // 5. Assert Vector r updated: scale.x should equal offset 3.8 cm
        const rScale = experiment.getVectorRScale();
        expect(rScale.x).toBeCloseTo(3.8, 1);

        // 6. Assert Vector Delta L (magenta) updated: height scale > 0
        const deltaLScale = experiment.getVectorDeltaLScale();
        expect(deltaLScale.y).toBeGreaterThan(5.0);

        // 7. Pinch SnapPoint1 (1/4 radius: r = 1.0 cm)
        const snapPoint1 = findInteractableByName("SnapPoint1");
        expect(snapPoint1).not.toBeNull();
        await interactor.trigger(snapPoint1);
        await sleep(300);

        expect(experiment.selectedSnapIndex).toBe(1);
        expect(experiment.getSelectedOffset()).toBeCloseTo(1.0, 1);
        const rScale1 = experiment.getVectorRScale();
        expect(rScale1.x).toBeCloseTo(1.0, 1);

        print("[LEAF] KinetixHandleVectorScenario PASSED!");
    }
}
