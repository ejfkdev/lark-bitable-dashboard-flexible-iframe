"use client";

import { Spin } from "@douyinfe/semi-ui";
import { dashboard } from "@lark-base-open/js-sdk";
import { useDocumentVisibility, useMemoizedFn, useRafInterval } from "ahooks";
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
  // 标签组，用于无缝刷新展示
  const [iframeList, SetIframeList] = useState<number[]>([]);
  const documentVisibility = useDocumentVisibility();

  useEffect(() => {
    SetIframeList([Date.now()]);
    setShow(false);
    // 如果网页静态资源过多，有ui展现但会迟迟不触发onload
    setTimeout(() => {
      setShow(true);
    }, 5000);
  }, [config.url]);

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

  const [timerID, setTimerID] = useState(-1);

  const refreshIframe = useMemoizedFn(() => {
    if (!config.refresh) return;
    if (iframeList.length < 2) {
      console.log(`开始刷新`);
      SetIframeList((prev) => [prev[0], Date.now()]);
    } else {
      // 页面还在加载中，但又到了刷新的时刻，清除上次重试任务
      clearTimeout(timerID);
      // 再重试一次
      const tid = setTimeout(refreshIframe, 10000);
      // @ts-ignore
      setTimerID(tid);
    }
  });

  // 定时刷新
  useRafInterval(refreshIframe, config.interval * config.intervalUnit);

  // 当网页从后台切换到前台，立即触发一次刷新
  useEffect(() => {
    if (documentVisibility === "visible") refreshIframe();
  }, [documentVisibility]);

  const iframeSwitch = useMemoizedFn((error?: true) => {
    if (iframeList.length < 2) return;
    if (!error) {
      // 静态资源加载完后，可能会有动态数据加载，等待一会再切换，也避免刷新太频繁
      setTimeout(() => {
        console.log(`切换网页`);
        SetIframeList((prev) => [prev[1]]);
      }, 3000);
    } else {
      // 把失败的iframe去掉，重试一次
      SetIframeList((prev) => [prev[0]]);
      refreshIframe();
    }
  });

  return (
    // 最外层与插件面板大小一致
    <div
      ref={wrapRef}
      className="relative flex-1 justify-center items-center place-items-center grid w-full h-full"
    >
      {/* 控制显示区域 */}
      <div className="top-0 right-0 bottom-0 left-0 absolute place-items-center grid overflow-hidden">
        {/* 网页加载中动画 */}
        {!show && config.url !== "" && (
          <Spin
            size="large"
            style={{
              position: `absolute`,
              top: `50%`,
              left: `50%`,
              transform: `translate(-50%, -50%)`,
            }}
          />
        )}
        {/* 切换动画，右下角显示一个干扰低的转圈动画 */}
        {iframeList.length > 1 && (
          <Spin
            size="small"
            style={{
              position: `absolute`,
              right: `0px`,
              bottom: `0px`,
              zIndex: 999,
              opacity: 0.3,
              transform: `translate(-50%, -50%)`,
            }}
          />
        )}
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
          {/* 网页 */}
          {iframeList.map((time, index) => {
            const idx = index;
            return (
              <iframe
                key={time}
                src={config.url}
                onLoad={() => {
                  setShow(true);
                  iframeSwitch();
                  if (idx === 0) setTimeout(dashboard.setRendered, 10);
                }}
                onError={() => {
                  // 如果网页有x-frame-options策略限制，会加载失败
                  // TODO 增加提示
                  // TODO api代理去除
                  iframeSwitch();
                  if (idx === 0) setShow(true);
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
                  zIndex: 1 - idx,
                }}
              ></iframe>
            );
          })}
        </div>
      </div>
    </div>
  );
}
