实现 patchChidren 方法，所涉及到的 case 有：

3. ArrayToText
   * unmounteChildren(c1)
     * hostRemove(child)
   * hostSetElementText
   * 代码重构
2. TextToText
   * newText !== oldText && hostSetElementText
3. TextToArray
   * hostSetElementText
   * mountChildren（参数类型变更，与 unmountChildren 保持一致，直接传children）
4. ArrayToArray
   * unmountChildren、mountChildren（粗糙实现）
   * 性能优化、双端对比

