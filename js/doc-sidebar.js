/**
 * 文档侧边栏交互
 */
(function () {
  "use strict";

  // ===== 树形目录展开/收起 =====
  function initDocTree() {
    const tree = document.querySelector(".doc-tree");
    if (!tree) return;

    // 点击箭头或文件夹名展开/收起
    tree.querySelectorAll(".tree-row").forEach(function (row) {
      const arrow = row.querySelector(".tree-arrow");
      const folderLabel = row.querySelector(".tree-folder");
      const children = row.nextElementSibling;

      // 只有有子项的才能展开
      if (!children || !children.classList.contains("tree-children")) return;

      function toggle() {
        arrow.classList.toggle("open");
        children.classList.toggle("open");
      }

      // 点击箭头
      if (arrow) {
        arrow.addEventListener("click", function (e) {
          e.stopPropagation();
          toggle();
        });
      }

      // 点击文件夹名（没有链接的项）
      if (folderLabel) {
        folderLabel.addEventListener("click", function (e) {
          e.stopPropagation();
          toggle();
        });
      }
    });
  }

  // ===== 移动端侧边栏切换 =====
  function initMobileSidebar() {
    const sidebar = document.querySelector(".doc-sidebar");
    const toggleBtn = document.querySelector(".doc-sidebar-toggle");

    if (!sidebar || !toggleBtn) return;

    // 创建遮罩
    const overlay = document.createElement("div");
    overlay.className = "doc-sidebar-overlay";
    document.body.appendChild(overlay);

    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
      document.body.style.overflow = sidebar.classList.contains("active")
        ? "hidden"
        : "";
    });

    overlay.addEventListener("click", function () {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    });

    // 点击链接后关闭侧边栏
    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove("active");
          overlay.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    });
  }

  // ===== 初始化 =====
  function init() {
    initDocTree();
    initMobileSidebar();
  }

  // DOM 加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
