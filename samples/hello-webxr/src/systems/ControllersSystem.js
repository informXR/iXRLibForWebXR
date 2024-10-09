import * as THREE from 'three';
import {System} from 'ecsy';
import {Area, AreaReactor, AreaInside, AreaExiting, AreaEntering, Object3D, AreaChecker, BoundingBox} from '../components/index.js';

export class ControllersSystem extends System {
  execute(delta, time) {
    const added = this.queries.checkers.added;
    const removed = this.queries.checkers.removed;

    for (let i = 0; i < added.length; i++) {
      const entity = added[i];
      const reactor = entity.getComponent(AreaReactor);
      reactor.onEntering(entity);
    }

    for (let i = 0; i < removed.length; i++) {
      const entity = removed[i];
      const reactor = entity.getComponent(AreaReactor);
      reactor.onExiting(entity);
    }

    // Log controller positions every 5 seconds
    if (Math.floor(time) % 5 === 0) {
      this.queries.controllers.results.forEach(entity => {
        const object3D = entity.getComponent(Object3D).value;
        const position = object3D.position;
        const rotation = object3D.rotation;
        // this.world.context.ixr.Telemetry('controller_data', {
        //   id: entity.id,
        //   position: `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`,
        //   rotation: `${rotation.x.toFixed(2)},${rotation.y.toFixed(2)},${rotation.z.toFixed(2)}`
        // });
      });
    }
  }
}

ControllersSystem.queries = {
  checkers: {
    components: [AreaChecker, Object3D, AreaInside],
    listen: {
      added: true,
      removed: true
    }
  },
  controllers: {
    components: [Object3D],
    listen: {
      added: true,
      removed: true
    }
  }
}
