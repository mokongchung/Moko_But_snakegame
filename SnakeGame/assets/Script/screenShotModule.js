let screenShotModule = cc.Class({
    extends: cc.Component,
    statics: {
        _instance: null,

        getInstance() {
            if (!this._instance) {
                console.warn("⚠️ screenShotModule chưa được tạo");
            }
            return this._instance;
        }
    },
    properties: {
        // kéo node CaptureCamera vào đây trong editor

    },

    onLoad() {
        console.log("on load screenShotModule")
        if (screenShotModule._instance) {
            // Nếu đã có instance rồi, tự hủy node này để tránh duplicate
            this.node.destroy();
            return;
        }
        screenShotModule._instance = this;

        // Giữ node này tồn tại xuyên scene
        cc.game.addPersistRootNode(this.node)
    },
    start() {

    },

    startCaptureScreen(node) {
        return new Promise((resolve, reject) => {
            if (!node) {
                reject("Node is null");
                return;
            }

            const cameraNode = new cc.Node("ScreenCaptureCamera");
            node.addChild(cameraNode);

            const camera = cameraNode.addComponent(cc.Camera);

            const winSize = cc.view.getVisibleSize();
            const renderTexture = new cc.RenderTexture();
            renderTexture.initWithSize(winSize.width, winSize.height);
            camera.targetTexture = renderTexture;

            cameraNode.zIndex = 9999;
            camera.cullingMask = 0xffffffff;
            camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH;
            camera.backgroundColor = cc.Color.BLACK;

            setTimeout(() => {
                camera.render();
                cameraNode.destroy();

                const base64 = this.convertTextureToBase64JPG(renderTexture);
                resolve(base64);
            }, 0);
        });
    }
    ,





    convertTextureToBase64JPG(renderTexture, quality = 0.8) {
        const width = renderTexture.width;
        const height = renderTexture.height;
        const pixels = renderTexture.readPixels();

        // Tạo canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Tạo ImageData và lật ảnh theo trục Y
        const imgData = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = ((height - y - 1) * width + x) * 4;
                const dstIdx = (y * width + x) * 4;

                imgData.data[dstIdx] = pixels[srcIdx];     // R
                imgData.data[dstIdx + 1] = pixels[srcIdx + 1]; // G
                imgData.data[dstIdx + 2] = pixels[srcIdx + 2]; // B
                imgData.data[dstIdx + 3] = pixels[srcIdx + 3]; // A
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Xuất ra base64 JPG với quality từ 0.0 đến 1.0 (mặc định 0.8)
        const base64JPG = canvas.toDataURL("image/jpeg", quality);
        console.log("Base64 JPG:", base64JPG);
        return base64JPG;
    },


    convertBase64ToTexture(base64String) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = base64String;

            image.onload = () => {
                const texture = new cc.Texture2D();
                texture.initWithElement(image);
                texture.handleLoadedTexture();
                resolve(texture);
            };

            image.onerror = (err) => {
                console.error("Error loading base64 image:", err);
                reject(err);
            };
        });
    }



});

module.exports = screenShotModule;