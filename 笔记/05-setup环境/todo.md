* 使用 yarn 初始化项目

  ```
  yarn init -y
  ```

* 集成 ts

  ```
  yarn add typescript -dev
  ```

  * 初始化 ts 项目（npm tsc -init）,生成 tsconfig.json

    

* 集成 jest

  * 安装 jest
  * 解决类型问题
    * 安装类型包（yarn add @types/jest--dev）
  * 解决 esm 使用问题https://jestjs.io/docs/
    * 依赖babel进行编译
    * 编译后，需要支持typescript







项目结构

* src

  * reactivity

    * index.ts

    * test

      * index.spec.ts

        ```
        it('init',()=>{
        	expect(true).toBe(true);
        })
        ```

        

