cc.Class({
  extends: cc.Component,

  properties: {
    captureCameraNode: cc.Node,  // kéo node CaptureCamera vào đây trong editor
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
    this.saveAsImage(renderTexture);
  },

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
  }
});
