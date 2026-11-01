// 始终使用 Windows GUI 子系统，避免运行期弹出命令行窗口
#![windows_subsystem = "windows"]

fn main() {
    keym_lib::run()
}
