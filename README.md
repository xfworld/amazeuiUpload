# Amaze UI Upload

Amaze UI Upload 插件。

**使用说明：**


1. 获取 Amaze UI Upload

  - [直接下载](https://github.com/xfworld/amazeuiUpload/archive/V1.1.zip)

2. 在 Amaze UI 样式之后引入 Upload 样式（`dist` 目录下的 CSS）：

  Amaze UI Upload 依赖 Amaze UI 样式。

  ```html
  <link rel="stylesheet" href="../dist/amazeui.min.css"/>
  <link rel="stylesheet" href="../dist/amazeui.upload.css"/>
  ```

3. 在 jQuery 之后引入 Upload 插件（`dist` 目录下的 JS）：

  ```html
  <script src="../dist/jquery.min.js"></script>
  <script src="../dist/amazeui.min.js"></script>
  <script src="../dist/amazeui.upload.js"></script>
  <script src="../dist/amazeui.upload.template.js"></script>
  <script src="../dist/amazeui.upload.event.js"></script>
  ```

4. Html 定义:
  ```html
  <div id="event"></div>
  ```


5. 初始化 Upload：

  ```js
  $(function(){
 	  $('#event').AmazeuiUpload({url : 'http://localhost/demo.json'});
  });
  ```



**更新说明：**

1. 主要更新：
    ```html
    1.1版本主要进行了重构，实现对象化，另外提供了插件初始化方法，销毁方法，置入上传对象等等；
    主要实现了插件的生命周期可控，可以上传，可以下载，主要实现请参考demo
    目前版本中存在messageBox的依赖，后期根据需求会重构该对象；
    ```


2. 调用说明： 
    ```js
     	var upload=$('#event').AmazeuiUpload({
     	                url : 'http://localhost/demo.json',
     	                downloadUrl :'',
     	                maxFiles: 50, // 单次上传的数量
                        maxFileSize: 10, // 单个文件允许的大小 (M)
                        multiThreading: false, // true为同时上传false为队列上传
                        useDefTemplate: true, //是否使用表格模式
                        dropType: false, //是否允许拖拽
                        pasteType: false //是否允许粘贴
     	           });

        upload.init(); //对象初始化
        upload.destory(); //对象销毁
        upload.setResult(); //置入已上传的对象
        upload.selectResult(); //获取当前已经完成上传的对象
      ```


**插件说明：**
  ```html
  目前组件支持两种模式
  1.Table 模式
  2.Card 模式

  关键字：useDefTemplate  true = Table模式 | false = Card模式

  上传组件一般都需要后端服务支持，我用ngnix模拟了一个Json文件，作为Post提交文件的应答输出；

  如果要操作docs下面的demo，请先切换到nginx目录下面。
  执行：start nginx
  启动nginx服务后，然后在切换到docs，体验demo；（请查阅80端口是否被其他服务占用，影响nginx启动）

  体验完毕后，请执行  nginx -s quit，以此来正常关闭nginx服务；
  ```

**遗留问题：**
  ```html
  1.目前尚未提供外部模块建立接口，只能修改内部的方法：建立其他的展示模版，并提供其他模版的操作项；
  2.所有的模版没有采用handlebars，均为Html的字符串；
  3.上传组件依赖后端服务响应，响应失败后，虽然结果集中不会增加ID，但是对于前端尚未有更多的测试；
  4.默认模版中，自定义类型可显示相应的示例图片。为了减少调试时间，我取消了该样式，在下个版本那种会增加进去；图片加载还存在问题，需要考虑采用懒加载的模式，加载完成后在显示图片；
  5.类型限定比较简陋
  6.消息提示采用的原始alert，下个版本替换为AmazeUI的标准功能项；
  7.AmazeUI 采用标准的对象封装，下个版本会参考这种方式，重构目前的功能，能够和AmazeUI进行统一打包，并使用AmazeUI中相关的UI的各种事件，减少依赖和解耦；
   ```
