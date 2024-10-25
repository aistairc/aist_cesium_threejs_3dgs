# AIST Cesium Threejs 3DGS

これは日本語のREADMEです。

[English version is available here](README.md)

[[DEMO]](https://hisayan.github.io/cesium-threejs-3dgs/)

## 1. 概要

CesiumJS の上に、3D Gaussian Splatting 形式のデータを位置付けて表示させるライブラリです。

## 2. Quick Start

本ライブラリを用いたデモを動作させます。

動作には [Node.js](https://nodejs.org/) が必要です。
動作確認は Ubuntu 22.04 LTS とNode.js v18.20.4 (LTS) で実施しています。

Ubuntu 22.04 LTS の標準バッケージで導入可能な Node.js (v12) では動作しないことを確認しています。
他のバージョンの Node.js による動作確認は実施していません。

デモ動作は Node.js を導入した環境で、以下のコマンドを実行します。

```shell
$ cp .env.example .env
$ npm run dev
```

実行したホストの 5173 番ポートで起動するので、Web ブラウザで `http://localhost:5173` へアクセスします。

ホストやポートの変更が必要場合は、`--host` および `--port` で任意の指定を行います。
ホストを 192.168.0.10、ポートを 18080 に変更する場合、以下のように指定します。

```shell
$ npm run dev -- --host=192.168.0.10 --port=18080
```

既になんらかの Web サーバが動作しており、そこで動作させるという場合は、以下のコマンドを実行し `dist` ディレクトリ以下の内容をデプロイします。

```shell
$ npm run build
```

## 3. 使い方

ThreeJS を事前に宣言し、その上で、cesiumThreejs3DGS.load3dgs を呼び出します。

### 3.1. 初期化

CesiumJS の Viewer を引数に、CesiumThreejs3DGS を生成します。

```javascript
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain(),
})

import CesiumThreejs3DGS from '/src/cesium-threejs-3dgs.ts'
const cesiumThreejs3DGS = new CesiumThreejs3DGS(viewer)
```

### 3.2 3D Gaussian Splatting の読み込み

URL を指定して、任意の緯度・経度・楕円体高に表示します

```javascript
cesiumThreejs3DGS.load3dgs({
  splatUrl: "./demo/nakajima.ksplat",
  lat: 33.973,
  lon: 132.63026,
  height: 40,
  headingPitchRoll: { heading: 37, pitch: 180, roll: 0 },
  scale: 45,
  camera: {
    offset: { x: 150, y: -70, z: 30 },
    headingPitchRoll: { heading: -20, pitch: -10, roll: 0 }
  }
})
```

| Parameter | Purpose |
| --- | --- |
| `splatUrl` | 3DGS の URLです
| `lat` | 配置する緯度です
| `lon` | 配置する経度です
| `height` | 配置する楕円体高です
| `headingPitchRoll` | 配置する際に傾けたりする角度です。度数法(degree) での指定で CesiumJS に準拠しています
| `scale` | 配置する際のスケールです。{x: 5, y: 5, z: 5} 形式にも対応しています
| `camera.offset` | 表示後のカメラ位置を設定できます（省略可能です）
| `camera.headingPitchRoll` | 表示後のカメラ画角を設定できます（省略可能です）

### 3.3 シーンの削除

新しく 3DGS を読み込む際は、読み込み済みのシーンを削除する必要があります。

```javascript
await cesiumThreejs3DGS.remove3dgsAll()
```

### 4. 3DGS データの事前準備

3DGS シーンを生成されたときのツールによっては、シーンに Skybox のような球体が補完されているケースがあります。

その場合は CesiumJS で少し離れたところからだと「球体」を外側からみるような状態になります。状況によって「球体」を事前編集して外すことも検討ください。

[![事前編集方法](doc/youtube.png)](https://youtu.be/rEvuZaIcKDU)

### 5. 3D Gaussian Splatting をつくるためのスキャンアプリ (参考)

+ [Luma AI Interactive Scenes](https://lumalabs.ai/interactive-scenes)

+ [Scaniverse](https://scaniverse.com/)

## 6. 既知の不具合など

### SharedMemory および GPU は利用していません

+ [CORS と SharedArryBuffer の関係が発展途上です](https://github.com/mkkellogg/GaussianSplats3D?tab=readme-ov-file#cors-issues-and-sharedarraybuffer)
+ そのため SharedMemory および GPU は利用していません

### 複数の 3DGS シーン表示に対応していません

+ 利用している 3D Gaussian splatting for Three.js のライブラリは複数シーンの描写に対応しているのですが、Three.js 上の座標 x, y, z が大きな数値（地球中心座標系など）で利用する場合、[描写がおかしくなる既知の不具合](https://github.com/mkkellogg/GaussianSplats3D/issues/336) があります。
+ そのため 1シーンのみを対象とし、上位のレベルで座標変換を行なっています
+ それに伴い シーンの Unload 時には都度、SplatViewer の破棄を行なっています

## 7. ライセンス

- 本ソフトウェアは、MITライセンスのもとで提供されるオープンソースソフトウエアです。
- ソースコードおよび関連ドキュメントの著作権は産業技術総合研究所に帰属します。
- 本ソフトウェアの開発は[株式会社アナザーブレイン](https://www.anotherbrain.co.jp/)が行っています。

## 8. 注意事項

- 本リポジトリおよびソフトウェアは動作の保証は行っておりません。
- 本リポジトリおよび本ソフトウェアの利用により生じた損失及び損害等について、開発者および産業技術総合研究所はいかなる責任も負わないものとします。
- 本リポジトリの内容は予告なく変更・削除する場合があります。

