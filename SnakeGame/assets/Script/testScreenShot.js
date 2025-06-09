cc.Class({
  extends: cc.Component,

  properties: {
    captureCameraNode: cc.Node,  // kéo node CaptureCamera vào đây trong editor
    SpriteShow : cc.Sprite,
    bg : cc.Sprite,
  },

  start(){
    this.captureScreen();

    
  },
  captureScreen() {
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
    this.sendTextureAsBase64(renderTexture)
  },

  sendTextureAsBase64(renderTexture ) {
    const width = renderTexture.width;
    const height = renderTexture.height;
    const pixels = renderTexture.readPixels();

    // Tạo canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const imgData = ctx.createImageData(width, height);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);

    // Xuất thành PNG base64
    const base64 = canvas.toDataURL("image/png"); // hoặc "image/jpeg"
    console.log("base64 img "+ base64);
    this.loadBase64ToSprite(base64);
    // Gửi qua socket
    /*
    socket.emit("image-base64", {
        width,
        height,
        dataUrl: base64
    });
    */
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


/*
  saveAsImage(renderTexture) {
    // Chuyển renderTexture thành texture2D
    let texture = new cc.Texture2D();
    texture.initWithData(
      renderTexture.readPixels(),
      cc.Texture2D.PixelFormat.RGBA8888,
      renderTexture.width,
      renderTexture.height
    );

    let spriteFrame = new cc.SpriteFrame();
    spriteFrame.setTexture(texture);

    // Gán lên 1 Sprite node nếu cần xem ảnh vừa chụp
    let preview = new cc.Node("Preview");
    let sprite = preview.addComponent(cc.Sprite);
    console.log("preview:" );
    sprite.spriteFrame = spriteFrame;
    this.node.addChild(preview);
  },

*/
});
