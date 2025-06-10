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
        captureCameraNode: cc.Node,  // kéo node CaptureCamera vào đây trong editor

    },

    onLoad() {
        console.log("on load screenShotModule")
        if (screenShotModule._instance) {
            // Nếu đã có instance rồi, tự hủy node này để tránh duplicate
            this.node.destroy();
            return;
        }
        screenShotModule._instance = this;
        console.warn("⚠️ screenShotModule được tạo");

        // Giữ node này tồn tại xuyên scene
        cc.game.addPersistRootNode(this.node)
    },
    start() {

    },
    startCaptureScreen2(node) {
        if (!node) {
            return;
        }
        const cameraNode = new cc.Node("ScreenCaptureCamera");
        cameraNode.parent = this.node; // gắn vào node hiện tại hoặc Canvas

        const camera = cameraNode.addComponent(cc.Camera);

        const renderTexture = new cc.RenderTexture();
        const winSize = cc.view.getVisibleSize();
        renderTexture.initWithSize(winSize.width, winSize.height);
        camera.targetTexture = renderTexture;

        //camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH;
        // camera.backgroundColor = cc.Color.BLACK;

        camera.render();
        cameraNode.destroy();
        return this.convertTextureToBase64JPG(renderTexture);


    },
    startCaptureScreen() {
        let camera = this.captureCameraNode.getComponent(cc.Camera);

        // Khởi tạo render texture
        let width = cc.visibleRect.width;
        let height = cc.visibleRect.height;
        let renderTexture = new cc.RenderTexture();
        renderTexture.initWithSize(width, height, cc.Texture2D.PixelFormat.RGBA8888);

        // Gán renderTexture vào camera
        camera.targetTexture = renderTexture;

        // Render scene
        camera.render();

        // Đọc dữ liệu ảnh (pixel)
        let data = renderTexture.readPixels();

        // DEBUG: Kiểm tra xem dữ liệu có đúng không
        console.log("Pixels:", data);

        // (Tùy chọn) lưu ảnh ra file hoặc convert sang base64
        //this.saveAsImage(renderTexture);
        return this.convertTextureToBase64JPG(renderTexture, 0.5);
    },

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


    loadBase64ToSprite(base64Str, spriteNode) {
        this.bg.enabled = false;

        // Tạo đối tượng Image
        let img = new Image();
        img.src = base64Str;
        img.crossOrigin = "anonymous"; // Tránh lỗi CORS
        let SpriteShow = this.SpriteShow;
        img.onload = function () {
            let texture = new cc.Texture2D();
            texture.initWithElement(img);
            texture.handleLoadedTexture();

            let spriteFrame = new cc.SpriteFrame(texture);

            // Gán spriteFrame vào Sprite node
            SpriteShow.spriteFrame = spriteFrame;
        };

        img.onerror = function (err) {
            console.error("Lỗi load base64 image:", err);
        };
    }


});

module.exports = screenShotModule;