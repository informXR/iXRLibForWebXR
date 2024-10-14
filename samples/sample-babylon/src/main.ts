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
// import { iXRInit } from "ixrlibforwebxr";

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

async function initializeIXR() {
  try {
    // let iXR = await iXRInit({
    //   appId: "",
    // });
    // console.log("iXR instance created successfully");

    // // You can now use iXR methods here or in other parts of your application
    // await iXR.LogInfo("Babylon.js application started");
  } catch (error) {
    console.error("Failed to initialize iXR:", error);
  }
}

async function main() {
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
      function () {
        // Change color of sphere
        rMat.diffuseColor = new Color3(
          Math.random(),
          Math.random(),
          Math.random()
        );
      }
    )
  );

  // Add behaviors to make meshes draggable
  const sphereDragBehavior = new SixDofDragBehavior();
  sphere.addBehavior(sphereDragBehavior);

  const boxDragBehavior = new SixDofDragBehavior();
  box.addBehavior(boxDragBehavior);

  const cylinderDragBehavior = new SixDofDragBehavior();
  cylinder.addBehavior(cylinderDragBehavior);

  // Setup default WebXR experience
  // Use the environment floor to enable teleportation
  await WebXRDefaultExperience.CreateAsync(scene, {
    floorMeshes: [envHelper?.ground as Mesh],
    optionalFeatures: true, // or specify the features you need
    // optionalFeatures: [WebXRFeatureName.NEAR_INTERACTION, WebXRFeatureName.TELEPORTATION],
  });

  // Initialize iXR after WebXR is set up
  // await initializeIXR();

  // You can add WebXR-specific iXR logging here if needed

  // Run render loop
  babylonEngine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    babylonEngine.resize();
  });
}

// Call the main function to start the application
main().catch(console.error);
