import { SegmentedControl, Switch } from "../../components/ui";
import { platform } from "../../lib/platform";
import { MD_READING_WIDTHS, type MdReadingWidth } from "../../lib/settings";
import { useSetting } from "../../lib/useSetting";

export function MarkdownSettings() {
  const [width, setWidth] = useSetting("mdReadingWidth");
  const [layout, setLayout] = useSetting("mdEditLayout");
  const [lineNumbers, setLineNumbers] = useSetting("mdLineNumbers");
  const [storage, setStorage] = useSetting("mdImageStorage");
  const [picgoUrl, setPicgoUrl] = useSetting("mdPicgoUrl");
  const [upicPath, setUpicPath] = useSetting("mdUpicPath");
  const changeWidth = (value: MdReadingWidth) => {
    setWidth(value);
    document.documentElement.style.setProperty("--folio-md-width", `${MD_READING_WIDTHS[value]}px`);
  };
  const description = {
    local: "粘贴的图片存到文稿旁的 assets 文件夹",
    picgo: "上传到 PicGo 图床（需要 PicGo 正在运行）",
    upic: "用 uPic 上传",
  }[storage];
  return (
    <section className="settings-group">
      <h3>文稿</h3>
      <div className="settings-list">
        <div className="settings-row settings-row-detail">
          <div className="settings-row-main">
            <span>阅读宽度</span>
            <SegmentedControl
              id="settings-md-reading-width"
              label="阅读宽度"
              value={width}
              onChange={changeWidth}
              items={[
                { value: "narrow", label: "窄" },
                { value: "standard", label: "标准" },
                { value: "wide", label: "宽" },
              ]}
            />
          </div>
          <p>调整 Markdown 正文栏的最大宽度</p>
        </div>
        <div className="settings-row">
          <span>编辑布局</span>
          <SegmentedControl
            id="settings-md-layout"
            label="编辑布局"
            value={layout}
            onChange={setLayout}
            items={[
              { value: "split", label: "分栏" },
              { value: "edit", label: "仅源码" },
            ]}
          />
        </div>
        <div className="settings-row">
          <span>显示行号</span>
          <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} label="显示行号" />
        </div>
        <div className="settings-row settings-row-detail">
          <div className="settings-row-main">
            <label htmlFor="settings-md-image-storage">图片保存</label>
            <select
              id="settings-md-image-storage"
              value={storage}
              onChange={(event) => setStorage(event.target.value as typeof storage)}
            >
              <option value="local">本地</option>
              <option value="picgo">PicGo</option>
              <option value="upic">uPic</option>
            </select>
          </div>
          <p>{description}</p>
        </div>
        {storage === "picgo" && (
          <div className="settings-row">
            <label htmlFor="settings-md-picgo-url">PicGo 服务地址</label>
            <input
              id="settings-md-picgo-url"
              value={picgoUrl}
              onChange={(event) => setPicgoUrl(event.target.value)}
            />
          </div>
        )}
        {storage === "upic" && (
          <div className="settings-row">
            <label htmlFor="settings-md-upic-path">uPic 路径</label>
            <div className="settings-path-control">
              <input
                id="settings-md-upic-path"
                value={upicPath}
                onChange={(event) => setUpicPath(event.target.value)}
              />
              <button
                type="button"
                onClick={async () => {
                  const chosen = await platform.pickUpic();
                  if (chosen) setUpicPath(chosen);
                }}
              >
                选择…
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
