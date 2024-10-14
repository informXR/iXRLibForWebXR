import "./style.css";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Scene } from "@babylonjs/core/scene.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience.js";
import { iXRInit, iXRInstance, InteractionType } from "ixrlibforwebxr";

// Required for EnvironmentHelper
import "@babylonjs/core/Materials/Textures/Loaders";

// Enable GLTF/GLB loader for loading controller models from WebXR Input registry
import "@babylonjs/loaders/glTF";

// Without this next import, an error message like this occurs loading controller models:
//  Build of NodeMaterial failed" error when loading controller model
//  Uncaught (in promise) Build of NodeMaterial failed: input rgba from block
//  FragmentOutput[FragmentOutputBlock] is not connected and is not optional.
import "@babylonjs/core/Materials/Node/Blocks";

// Import behaviors and actions
import { SixDofDragBehavior } from "@babylonjs/core/Behaviors/Meshes/sixDofDragBehavior.js";
import { ActionManager } from "@babylonjs/core/Actions/actionManager.js";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions.js";

let iXR: iXRInstance;

// Hardcoded device ID and model (matching server.js)
const DEVICE_ID = 'iXRLibForWebXR_device_id';
const DEVICE_MODEL = 'iXRLibForWebXR_device_model';

async function initializeIXR() {
  try {
    iXR = await iXRInit({
      appId: "471fd6fd-f5d0-4096-bc0c-17100c1c4fa0",
      deviceId: DEVICE_ID,
      deviceModel: DEVICE_MODEL,
    });
    console.log("iXR instance created successfully");

    // Log application start
    await iXR.LogInfo("Babylon.js application started");
    await iXR.Event("application_start", "engine=babylon.js,version=5.0");

    // Ping the server
    const pingResponse = await iXR.Ping();
    console.log("Ping response:", pingResponse);
  } catch (error) {
    console.error("Failed to initialize iXR:", error);
  }
}

async function main() {
  // Initialize iXR before setting up the scene
  await initializeIXR();

  // Create a canvas element for rendering
  const app = document.querySelector<HTMLDivElement>("#app");
  const canvas = document.createElement("canvas");
  app?.appendChild(canvas);

  // Create engine and a scene
  const babylonEngine = new Engine(canvas, true);
  const scene = new Scene(babylonEngine);

  // Add a basic light
  new HemisphericLight("light1", new Vector3(0, 2, 0), scene);

  // Create a default environment (skybox, ground mesh, etc)
  const envHelper = new EnvironmentHelper(
    {
      skyboxSize: 30,
      groundColor: new Color3(0.5, 0.5, 0.5),
    },
    scene
  );

  // Add a camera for the non-VR view in browser
  const camera = new ArcRotateCamera(
    "Camera",
    -(Math.PI / 4) * 3,
    Math.PI / 4,
    10,
    new Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);

  // Add a sphere to have something to look at
  const sphereD = 1.0;
  const sphere = MeshBuilder.CreateSphere(
    "xSphere",
    { segments: 16, diameter: sphereD },
    scene
  );
  sphere.position.x = 0;
  sphere.position.y = sphereD * 2;
  sphere.position.z = 0;
  const rMat = new StandardMaterial("matR", scene);
  rMat.diffuseColor = new Color3(1.0, 0, 0);
  sphere.material = rMat;
  sphere.isPickable = true;

  // Create a box
  const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
  box.position = new Vector3(2, 1, 0);
  const gMat = new StandardMaterial("matG", scene);
  gMat.diffuseColor = new Color3(0, 1.0, 0);
  box.material = gMat;
  box.isPickable = true;

  // Create a cylinder
  const cylinder = MeshBuilder.CreateCylinder(
    "cylinder",
    { diameter: 1, height: 2 },
    scene
  );
  cylinder.position = new Vector3(-2, 1, 0);
  const bMat = new StandardMaterial("matB", scene);
  bMat.diffuseColor = new Color3(0, 0, 1.0);
  cylinder.material = bMat;
  cylinder.isPickable = true;

  // Create a button
  const button = MeshBuilder.CreateBox("button", { size: 0.5 }, scene);
  button.position = new Vector3(0, 0.5, -2);
  const buttonMat = new StandardMaterial("buttonMat", scene);
  buttonMat.diffuseColor = new Color3(1.0, 1.0, 0);
  button.material = buttonMat;
  button.isPickable = true;

  // Add action to the button
  button.actionManager = new ActionManager(scene);
  button.actionManager.registerAction(
    new ExecuteCodeAction(
      {
        trigger: ActionManager.OnPickDownTrigger,
      },
      async function () {
        // Change color of sphere
        rMat.diffuseColor = new Color3(
          Math.random(),
          Math.random(),
          Math.random()
        );

        // Log button press and color change with iXR
        await iXR.Event("button_pressed", "action=change_sphere_color");
        await iXR.LogInfo("Sphere color changed");
        await iXR.EventInteractionComplete("change_sphere_color", "success", "Color changed successfully", InteractionType.Bool);
      }
    )
  );

  // Add behaviors to make meshes draggable
  addDragBehavior(sphere);
  addDragBehavior(box);
  addDragBehavior(cylinder);

  // Setup default WebXR experience
  // Use the environment floor to enable teleportation
  await WebXRDefaultExperience.CreateAsync(scene, {
    floorMeshes: [envHelper?.ground as Mesh],
    optionalFeatures: true, // or specify the features you need
    // optionalFeatures: [WebXRFeatureName.NEAR_INTERACTION, WebXRFeatureName.TELEPORTATION],
  });

  // Log that the scene is set up
  await iXR.LogInfo("Babylon.js scene set up completed");

  // Run render loop
  babylonEngine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    babylonEngine.resize();
  });

  // Log telemetry data
  await iXR.Telemetry("scene_stats", {
    objects: scene.meshes.length,
    lights: scene.lights.length,
    materials: scene.materials.length,
  });

  // Start a level event
  await iXR.EventLevelStart("main_scene", { objects: scene.meshes.length.toString() });
}

function addDragBehavior(mesh: Mesh) {
  const dragBehavior = new SixDofDragBehavior();
  mesh.addBehavior(dragBehavior);

  dragBehavior.onDragStartObservable.add(() => {
    iXR.EventInteractionStart(`drag_${mesh.name}`, { object: mesh.name });
  });

  dragBehavior.onDragEndObservable.add(() => {
    iXR.EventInteractionComplete(`drag_${mesh.name}`, "complete", `${mesh.name} dragged to ${mesh.position.toString()}`, InteractionType.Text);
  });
}

// Call the main function to start the application
main().catch(async (error) => {
  console.error(error);
  if (iXR) {
    await iXR.LogError(`Application error: ${error.message}`);
  }
});
