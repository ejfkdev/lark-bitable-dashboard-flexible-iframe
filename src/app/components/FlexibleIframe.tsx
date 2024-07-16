"use client";

import { Spin } from "@douyinfe/semi-ui";
import { dashboard } from "@lark-base-open/js-sdk";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { useComponentSize } from "react-use-size";

export default function FlexibleIframe({
  config,
  isConfig,
}: {
  config: ICustomConfig;
  isConfig?: boolean;
}) {
  // 缩放比例
  const [scale, setScale] = useState(1);
  // 网页加载中动画
  const [show, setShow] = useState(false);

  // 外层元素大小，用于实时自适应插件面板大小
  const { ref: wrapRef, ...wrapSize } = useComponentSize();

  // 根据显示模式计算缩放
  useEffect(() => {
    let scale = 1;
    if (config.fit === "static") {
      scale = 1;
    } else if (config.fit === "contain") {
      scale =
        wrapSize.width / config.width < wrapSize.height / config.height
          ? wrapSize.width / config.width
          : wrapSize.height / config.height;
    } else if (config.fit === "cover") {
      scale =
        wrapSize.width / config.width > wrapSize.height / config.height
          ? wrapSize.width / config.width
          : wrapSize.height / config.height;
    }
    setScale(scale);
  }, [config.fit, wrapSize]);

  useEffect(() => {
    setShow(false);
    // 如果网页静态资源过多，有ui展现但会迟迟不触发onload
    setTimeout(() => {
      setShow(true);
    }, 3000);
  }, [config.url]);

  return (
    // 最外层与插件面板大小一致
    <div
      ref={wrapRef}
      className="relative flex-1 justify-center items-center place-items-center grid w-full h-full"
    >
      {/* 控制显示区域 */}
      <div className="top-0 right-0 bottom-0 left-0 absolute place-items-center grid overflow-hidden">
        {/* 控制可视区域大小 + 整体缩放 */}
        <div
          className={`absolute overflow-hidden rounded-lg box-content ${classNames(
            {
              // 配置预览时，显示实际网页大小的边框
              "border-2": isConfig,
              "border-dashed": isConfig,
              "border-gray-300": isConfig,
            }
          )}`}
          style={{
            width: `${config.width}px`,
            height: `${config.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: `50% 50%`,
          }}
        >
          {/* 网页加载中动画 */}
          {!show && config.url !== "" && (
            <Spin
              size="large"
              style={{
                position: `absolute`,
                top: `50%`,
                left: `50%`,
                transform: `scale(${1 / scale}) translate(-50%, -50%)`,
              }}
            />
          )}
          {/* 网页 */}
          <iframe
            src={config.url}
            onLoad={() => {
              setShow(true);
              setTimeout(dashboard.setRendered, 10);
            }}
            onError={() => {
              // 如果网页有x-frame-options策略限制，会加载失败
              // TODO 增加提示
              // TODO api代理去除
              setShow(true);
            }}
            className={`absolute border-0 overflow-hidden ${classNames({
              visible: show,
              invisible: !show,
              // 网页可以配置成可以点击交互
              "pointer-events-none": config.clickable != true,
            })}`}
            referrerPolicy="same-origin"
            sandbox="allow-scripts allow-same-origin allow-forms"
            scrolling="no"
            style={{
              width: `${config.webWidth}px`,
              height: `${config.webHeight}px`,
              marginLeft: `${-config.left}px`,
              marginTop: `${-config.top}px`,
            }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}
