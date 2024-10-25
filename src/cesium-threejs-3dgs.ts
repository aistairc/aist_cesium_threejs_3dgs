import './style.css'
import {
  Viewer as CesiumViewer,
  Cartesian3 as CesiumCartesian3,
  Transforms as CesiumTransforms,
  Matrix4 as CesiumMatrix4,
  Matrix3 as CesiumMatrix3,
  Quaternion as CesiumQuaternion,
  Math as CesiumMath,
  HeadingPitchRoll as CesiumHeadingPitchRoll
} from 'cesium'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// TODO: types https://github.com/mkkellogg/GaussianSplats3D/issues/52
// @ts-ignore
import { Viewer as GSViewer, SceneRevealMode as GSSceneRevealMode, SplatRenderMode } from "@mkkellogg/gaussian-splats-3d";

// const SCALE_BASE = 1 / 10000;
const SCALE_BASE = 1 / 1;

class CesiumThreeJS3DGS {
  cesiumViewer: CesiumViewer | null = null
  threeContainer: HTMLElement | null = null

  three: {
    renderer: THREE.WebGLRenderer | null;
    camera: THREE.PerspectiveCamera | null;
    scene: THREE.Scene | null;
    controls: OrbitControls | null;
    splatViewer: any;
  } = {
      renderer: null,
      camera: null,
      scene: null,
      controls: null,
      splatViewer: null,
    };

  tc: HTMLElement | null = null

  constructor(cesiumViewer: CesiumViewer | null = null, threeContainer: HTMLElement | string | null = null) {

    let tc: HTMLElement | null;
    if (cesiumViewer) {
      this.initCesium(cesiumViewer)

      if (!threeContainer) {
        tc = document.createElement('div')
        tc.id = 'threeContainer'
        cesiumViewer.container.insertAdjacentElement('afterend', tc)
      } else if (typeof threeContainer === 'string') {
        tc = document.getElementById(threeContainer)
      } else {
        tc = threeContainer
      }

      if (tc) {
        this.threeContainer = tc

        var fov = 45;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var aspect = width / height;
        var near = 0.1 // * SCALE_BASE;
        var far = 5000 //* SCALE_BASE;  // TODO

        this.three.scene = new THREE.Scene();
        this.three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.three.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.threeContainer.appendChild(this.three.renderer.domElement);

        const onResize = () => {

          // console.log("fovy", this.cesiumViewer.camera.frustum.fovy)
          // サイズを取得
          this.three.camera!.fov = CesiumMath.toDegrees(
            //@ts-ignore
            this.cesiumViewer.camera.frustum.fovy
          ); // ThreeJS FOV is vertical
          this.three.camera!.updateProjectionMatrix();

          var width = this.threeContainer!.clientWidth;
          var height = this.threeContainer!.clientHeight;

          // レンダラーのサイズを調整する
          this.three.renderer!.setPixelRatio(window.devicePixelRatio);
          this.three.renderer!.setSize(width, height);

          // カメラのアスペクト比を正す
          this.three.camera!.aspect = width / height;
          this.three.camera!.updateProjectionMatrix();
        }

        // 初期化のために実行
        onResize();
        // リサイズイベント発生時に実行
        window.addEventListener('resize', onResize);

      }
      this.three.camera!.matrixAutoUpdate = false;
    }
  }

  initCesium(viewer: CesiumViewer) {
    this.cesiumViewer = viewer
  }

  async initThree() {

    this.three.splatViewer = new GSViewer({
      selfDrivenMode: false,
      renderer: this.three.renderer,
      camera: this.three.camera,
      useBuiltInControls: false,

      // dynamicScene: true,
      threeScene: this.three.scene,
      sceneRevealMode: GSSceneRevealMode.Instant,
      integerBasedSort: true, // false のほうが遅くなるが精度は高い
      // CORS と SharedArryBuffer の関係が発展途上
      // https://github.com/mkkellogg/GaussianSplats3D?tab=readme-ov-file#cors-issues-and-sharedarraybuffer
      gpuAcceleratedSort: false,
      sharedMemoryForWorkers: false,
      // splatSortDistanceMapPrecision: 20,
      // freeIntermediateSplatData: true,
      // optimizeSplatData: false
    });

    // Debug info (必要に応じて座標などを表示)
    // this.three.splatViewer.showInfo = true;
    // this.three.splatViewer.infoPanel.show();

  }

  async remove3dgsAll(showloadingUI = true) {
    if (!this.three.splatViewer) return
    const indexesToRemove = []
    for (let i = 0; i < this.three.splatViewer.getSceneCount(); i++) {
      indexesToRemove.push(i);
    }
    if (indexesToRemove.length > 0) {
      await this.three.splatViewer.removeSplatScenes(indexesToRemove, showloadingUI)
    } else {
      if (this.three.splatViewer.isLoadingOrUnloading()) {
        // 最初の1件をローディング中の場合、removeSplatScenes が走らないのでエラーにならないため
        throw new Error("Cannot add splat scene while another load or unload is already in progress.");
      }
    }

    // 念の為 原点などもリセット
    // const splatMesh = this.three.splatViewer.getSplatMesh();
    // splatMesh.position.set(0, 0, 0)
    // splatMesh.quaternion.set(0, 0, 0, 0)
    // splatMesh.scale.set(1, 1, 1)

    // これも非表示のためには必要
    this.three.splatViewer.update();
    this.three.splatViewer.render();

    // 一度削除してしまう
    await this.dispose()
    delete this.three.splatViewer

  }

  async dispose() {
    if (this.three.splatViewer) {
      await this.three.splatViewer.dispose()
    }
  }

  async load3dgs({
    splatUrl,
    lat,
    lon,
    height,
    headingPitchRoll,
    scale,
    camera
  }: {
    splatUrl: string,
    lat: number,
    lon: number,
    height: number,
    headingPitchRoll: { heading: number, pitch: number, roll: number },
    scale: number | { x: number, y: number, z: number },
    camera: {
      offset: { x: number, y: number, z: number } | undefined,
      headingPitchRoll: { heading: number, pitch: number, roll: number } | undefined,
    } | undefined
  }
  ) {

    await this.initThree();

    if (typeof scale === "number") {
      scale = { x: scale, y: scale, z: scale }
    }

    var position = CesiumCartesian3.fromDegrees(
      lon,
      lat,
      height
    );

    var p =
      CesiumCartesian3.multiplyByScalar(
        position,
        SCALE_BASE,
        new CesiumCartesian3()
      )

    // ENU フレームの変換行列を取得
    var enuTransform = CesiumTransforms.eastNorthUpToFixedFrame(position);
    // 逆行列から3x3の回転行列部分を抽出
    var rotationMatrix = CesiumMatrix4.getRotation(
      enuTransform,
      new CesiumMatrix3()
    );
    var quaternion = CesiumQuaternion.fromRotationMatrix(rotationMatrix);

    const q5 = CesiumQuaternion.fromHeadingPitchRoll(new CesiumHeadingPitchRoll(CesiumMath.toRadians(headingPitchRoll.heading), CesiumMath.toRadians(headingPitchRoll.pitch), CesiumMath.toRadians(headingPitchRoll.roll))) // さかさま？
    let q = CesiumQuaternion.multiply(quaternion, q5, new CesiumQuaternion());

    // Cesium の座標系は、Z軸が上向きなので、THREE に合わせるために、X軸を中心に90度回転
    let q6 = CesiumQuaternion.fromAxisAngle(
      new CesiumCartesian3(1, 0, 0),
      CesiumMath.toRadians(90)
    );
    q = CesiumQuaternion.multiply(
      q,
      q6,
      new CesiumQuaternion()
    );

    if (!(camera && camera.offset && camera.headingPitchRoll)) {
      // カメラを少し動かすことにより、描写が美しくなるので 10m ほど一旦引いて戻す
      this.cesiumViewer?.camera.moveBackward(10);
    }

    await this.three.splatViewer.addSplatScene(
      splatUrl,
      {
        // 複数モデルを配置するなどの場合は、この設定方法も検討
        // position: [p.x, p.y, p.z],
        // rotation: [q.x, q.y, q.z, q.w],
        // scale: [SCALE_BASE * scale.x, SCALE_BASE * scale.y, SCALE_BASE * scale.z]
      }
    );

    // v0.4.4, v0.4.5 はカメラ移動がガタガタする。こちらの設定なら複数同時表示にも対応可能（メモリは必要）
    // v0.4.3 も同じ設定ができるが、ガタガタも同じ
    // const splatMesh = this.three.splatViewer.getSplatScene(this.three.splatViewer.getSceneCount() - 1)

    // こちらだと設定が可能でカメラ移動もスムース。しかし1モデルしか対応できない
    const splatMesh = this.three.splatViewer.getSplatMesh();

    splatMesh.position.set(p.x, p.y, p.z)
    splatMesh.quaternion.set(q.x, q.y, q.z, q.w)
    splatMesh.scale.set(SCALE_BASE * scale.x, SCALE_BASE * scale.y, SCALE_BASE * scale.z)


    // カメラ位置
    if (camera && camera.offset && camera.headingPitchRoll) {
      var nloc = [lon, lat];
      var targetCartesian = CesiumCartesian3.fromDegrees(
        nloc[0],
        nloc[1],
        height
      )
      // ENU（East-North-Up）変換行列を取得
      var enuMatrix =
        CesiumTransforms.eastNorthUpToFixedFrame(targetCartesian)

      // カメラ座標の変換
      // ローカル座標（ターゲットオブジェクトを原点とする）
      var localPosition = new CesiumCartesian3(
        camera.offset.x, // * manualScale,
        camera.offset.y, // * manualScale,
        camera.offset.z // * manualScale
      ) // ローカル座標での位置
      // ローカル座標をワールド座標に変換
      var worldPosition = CesiumMatrix4.multiplyByPoint(
        enuMatrix,
        localPosition,
        new CesiumCartesian3()
      )

      // 要検討
      await this.cesiumViewer?.camera.flyTo({
        destination: worldPosition,
        orientation: {
          heading: CesiumMath.toRadians(
            camera.headingPitchRoll?.heading - headingPitchRoll.heading
          ),
          pitch: CesiumMath.toRadians(camera.headingPitchRoll?.pitch),
          roll: CesiumMath.toRadians(camera.headingPitchRoll?.roll),
        },
        duration: 3,
      });
    } else {
      // カメラを少し動かすことにより、描写が美しくなるので 10m ほど一旦引いて戻す
      this.cesiumViewer?.camera.moveForward(10);
    }

    // v0.4.4 以降は this.three.splatViewer.getSceneCount
    // return this.three.splatViewer.getSplatScene(this.three.splatViewer.getSplatMesh().getSplatCount() - 1)
    return 0;
  }

  renderThreeObj() {

    if (!this.three.camera || !this.cesiumViewer || !this.threeContainer || !this.three.renderer) {
      return;
    }

    var civm = this.cesiumViewer.camera.inverseViewMatrix;

    // 3. スケーリング行列を作成
    var scaleMatrix = CesiumMatrix4.fromScale(
      new CesiumCartesian3(SCALE_BASE, SCALE_BASE, SCALE_BASE)
    );

    // 4. ビュー行列とスケーリング行列を掛け算して新しいビュー行列を作成
    var scaledViewMatrix = CesiumMatrix4.multiply(
      scaleMatrix,
      civm,
      new CesiumMatrix4()
    );

    this.three.camera.matrixWorld.set(
      scaledViewMatrix[0],
      scaledViewMatrix[4],
      scaledViewMatrix[8],
      scaledViewMatrix[12],
      scaledViewMatrix[1],
      scaledViewMatrix[5],
      scaledViewMatrix[9],
      scaledViewMatrix[13],
      scaledViewMatrix[2],
      scaledViewMatrix[6],
      scaledViewMatrix[10],
      scaledViewMatrix[14],
      scaledViewMatrix[3],
      scaledViewMatrix[7],
      scaledViewMatrix[11],
      scaledViewMatrix[15]
    );

    // // position, quaternion, scale に反映 (for Debug)
    this.three.camera.matrixWorld.decompose(this.three.camera.position, this.three.camera.quaternion, this.three.camera.scale)

    if (this.three.splatViewer) {
      this.three.splatViewer.update();
      this.three.splatViewer.render();
    }
  }
}

export default CesiumThreeJS3DGS


