"use client";
// 必须用arco的Slider，为了动态max
import { Slider } from "@arco-design/web-react";
import { Button, Spin, Tooltip } from "@douyinfe/semi-ui";
import { useMemoizedFn, useUpdate } from "ahooks";
import classNames from "classnames";
import { useEffect, useRef, useState, type WheelEvent } from "react";
import { Rnd } from "react-rnd";
import { useComponentSize } from "react-use-size";

export default function FlexibleIframeConf({
  config,
  updateWebBaseHeight,
}: {
  config: ICustomConfig;
  updateWebBaseHeight: () => void;
}) {
  const [topBox, setTopBox] = useState(0);
  const [topIframe, setTopIframe] = useState(0);
  const [scrollValue, setScrollValue] = useState(0);
  const [show, setShow] = useState(false);
  const [scrollMax, setScrollMax] = useState(config.webWidth);

  // 网页真实完整高度
  // const [heightIFrame, setHeightIFrame] = useState(config.webWidth);
  // 缩放比例
  const [scale, setScale] = useState(1);
  // 真实高度经过缩放后视觉高度正好等于外层容器高度
  const [scaleHeight, setScaleHeight] = useState(0);

  // 外层容器，真实大小等于视觉大小
  const { ref: rawRef, ...rawSize } = useComponentSize();
  // 经过缩放后，视觉大小正好等于外层容器，可用于获取缩放前大小
  const { ref: scaleRef, ...scaleSize } = useComponentSize();

  const rndRef = useRef<Rnd | null>(null);

  useEffect(() => {
    setShow(false);
    setTimeout(() => {
      setShow(true);
    }, 3000);
  }, [config.url]);

  // 滚动条和伸缩框高度坐标同步给表单
  useEffect(() => {
    console.log(
      `set config.top 1`,
      config.top,
      `topIframe`,
      topIframe,
      `topBox`,
      topBox
    );
    requestAnimationFrame(() => {
      if (config.top != topIframe + topBox) {
        console.log(
          `set config.top 2`,
          config.top,
          `topIframe`,
          topIframe,
          `topBox`,
          topBox
        );
        config.top = topIframe + topBox;
      }
    });
  }, [topIframe, topBox]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (config.top === config.webHeight + topBox) return;
      if (config.top < topBox) {
        setTopIframe(0);
        setTopBox(config.top);
      } else {
        const topIframe = config.top - topBox;
        setTopIframe(topIframe);
      }
    });
  }, [config.top, scaleHeight]);

  useEffect(() => {
    requestAnimationFrame(() => {
      rndRef.current?.forceUpdate();
    });
  }, [config.webHeight, config.webWidth]);

  const initScroll = useMemoizedFn(() => {
    requestAnimationFrame(() => {
      if (scaleHeight <= config.height) return;
      // 选择框要上下居中，需要距离顶部的高度
      const middleTop = Math.round(scaleHeight / 2 - config.height / 2);
      // 不能超过iframe的可移动距离
      let diff = Math.min(middleTop - topBox, topIframe);
      console.log(
        `initScroll`,
        `topIframe`,
        topIframe,
        `middleTop`,
        middleTop,
        `topBox`,
        topBox,
        `diff`,
        diff
      );
      // 选择框先移动到中央
      setTopBox(topBox + diff);
      // topIframe减小是下移网页
      // 同步滚动条
      const value = topIframe - diff;
      setTopIframe(value);
      console.log(
        `initScroll setScrollValue`,
        value,
        `topBox`,
        topBox + diff,
        `topIframe`,
        topIframe - diff,
        `scaleHeight`,
        scaleHeight
      );
      setScrollValue(value);
      setShow(true);
    });
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      // config.webHeight = scrollValue + config.webWidth;
      setTopIframe(scrollValue as number);
    });
  }, [scrollValue]);

  // 自适应插件面板大小,进行缩放
  useEffect(() => {
    requestAnimationFrame(() => {
      if (rawSize.height === 0) return;
      const scale = rawSize.width / config.webWidth;
      setScale(scale);
      const scaleHeight = rawSize.height / scale;
      setScaleHeight(scaleHeight);
      if (config.height === 0) {
        config.height = scaleHeight;
      }
    });
  }, [rawSize]);

  const css = (_: any) => {};

  const Dot = () => {
    return (
      <div
        style={{
          background: `var(--semi-color-primary)`,
          border: `2px solid var(--semi-color-tertiary-light-default)`,
          borderRadius: `50%`,
          boxSizing: `border-box`,
          display: `block`,
          overflow: `hidden`,
          position: `absolute`,
          left: `3px`,
          top: `3px`,
          right: `3px`,
          bottom: `3px`,
        }}
      ></div>
    );
  };

  const onWheel = (e: WheelEvent) => {
    setScrollValue((prev) => {
      let v = Math.round(prev + e.deltaY);
      if (v < 0) v = 0;
      setScrollMax((prev) => Math.max(v, prev));
      return v;
    });
  };

  return (
    <div
      className="box-border flex flex-1 border-2 border-gray-300 shadow-xl rounded-2xl w-full max-w-[calc(100vh)] h-full overflow-hidden"
      onWheel={onWheel}
    >
      <div className="flex p-4 overflow-hidden grow">
        <div ref={rawRef} className="relative flex w-full h-full grow">
          <div
            className="absolute grow"
            ref={scaleRef}
            style={{
              boxShadow: `0px 0px 0px 1px #ccc`,
              width: `${config.webWidth}px`,
              height: `${scaleHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: `left top`,
            }}
          >
            <Rnd
              ref={rndRef}
              disableDragging={!show}
              size={{
                width: config.width,
                height: config.height,
              }}
              position={{
                x: config.left,
                y: topBox,
              }}
              className="box-content bg-white/10"
              style={{
                boxShadow: `0px 0px 0px 200vw rgba(0, 0, 0, .3)`,
                border: `${2 / scale}px solid var(--semi-color-primary)`,
                zIndex: 10,
              }}
              default={{
                x: 0,
                y: 0,
                width: 320,
                height: 200,
              }}
              minWidth={30}
              minHeight={20}
              maxWidth={config.webWidth}
              maxHeight={scaleHeight}
              scale={scale}
              bounds={scaleRef.current}
              resizeHandleComponent={{
                topLeft: <Dot />,
                topRight: <Dot />,
                bottomLeft: <Dot />,
                bottomRight: <Dot />,
              }}
              resizeHandleStyles={{
                bottom: {
                  transform: `scaleY(${1 / scale})`,
                },
                left: {
                  transform: `scaleX(${1 / scale})`,
                },
                right: {
                  transform: `scaleX(${1 / scale})`,
                },
                top: {
                  transform: `scaleY(${1 / scale})`,
                },
                topLeft: {
                  transform: `scale(${1 / scale})`,
                },
                topRight: {
                  transform: `scale(${1 / scale})`,
                },
                bottomLeft: {
                  transform: `scale(${1 / scale})`,
                },
                bottomRight: {
                  transform: `scale(${1 / scale})`,
                },
              }}
              onDrag={(e, d) => {
                requestAnimationFrame(() => {
                  config.left = Math.round(d.x);
                  setTopBox(Math.round(d.y));
                });
              }}
              onResize={(e, direction, ref, delta, position) => {
                config.left = Math.round(position.x);
                setTopBox(Math.round(position.y));
                config.width = ref.offsetWidth;
                config.height = ref.offsetHeight;
                // config.width += delta.width;
                // config.height += delta.height;
                console.log(
                  `onresize`,
                  `delta`,
                  delta,
                  `y`,
                  position.y,
                  `ch`,
                  ref.clientHeight,
                  `cw`,
                  ref.clientWidth,
                  `oh`,
                  ref.offsetHeight,
                  `ow`,
                  ref.offsetWidth,
                  Math.round(position.y) + ref.clientHeight,
                  config.webHeight,
                  Math.round(position.y) + ref.clientHeight > config.webHeight
                );
                if (
                  Math.round(position.y) + ref.offsetHeight >
                  config.webHeight
                ) {
                  config.webHeight = Math.round(position.y) + ref.offsetHeight;
                  updateWebBaseHeight();
                }
              }}
              onDragStop={(e, d) => {
                requestAnimationFrame(() => {
                  config.left = d.x;
                  setTopBox(d.y);
                });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                return;
                console.log(
                  `onResizeStop`,
                  `w`,
                  ref.clientWidth,
                  `h`,
                  ref.clientHeight
                );
                requestAnimationFrame(() => {
                  config.width = ref.clientWidth;
                  config.height = ref.clientHeight;
                  rndRef.current?.updateSize({
                    width: ref.clientWidth,
                    height: ref.clientHeight,
                  });
                  rndRef.current?.forceUpdate();
                });
              }}
            ></Rnd>
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
            <iframe
              src={config.url}
              onLoad={initScroll}
              onError={() => setShow(true)}
              className={`top-0 left-0 box-content absolute border-0 w-full overflow-hidden pointer-events-none ${classNames(
                {
                  visible: show,
                  invisible: !show,
                }
              )}`}
              referrerPolicy="same-origin"
              sandbox="allow-scripts allow-same-origin allow-forms"
              scrolling="no"
              style={{
                width: `${config.webWidth}px`,
                height: `${config.webHeight}px`,
                transform: `translateY(${-topIframe}px)`,
              }}
            ></iframe>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col justify-center items-center py-4 w-12"
        // 鼠标变为滚轮样式
        style={{
          cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2rem' height='2rem' viewBox='0 0 24 24'%3E%3Cg fill='%23999'%3E%3Cpath d='m9.172 16.818l-1.415 1.414L12 22.475l4.243-4.243l-1.415-1.414L12 19.647zm5.656-9.636l1.415-1.414L12 1.525L7.757 5.768l1.415 1.414L12 4.354z'/%3E%3Cpath fill-rule='evenodd' d='M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0 2a1 1 0 1 1 0 2a1 1 0 0 1 0-2' clip-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E"), auto`,
        }}
      >
        <Slider
          vertical
          reverse
          step={1}
          min={0}
          max={scrollMax}
          value={scrollValue}
          defaultValue={0}
          tooltipVisible={false}
          onChange={(value) => {
            setScrollValue(value as number);
          }}
          className="flex-1 mb-4 iframe-config-slider"
          style={{
            display: "inline-grid",
          }}
        />
        <Tooltip content={"增加网页高度"} position="right">
          <Button
            theme="outline"
            type="primary"
            block
            icon={
              <span className="text-2xl icon-[fluent--padding-down-24-filled]"></span>
            }
            style={{
              width: `32px`,
              height: `32px`,
            }}
            onClick={() => {
              setScrollMax((prev) => prev + 500);
              setScrollValue((prev) => prev + 500);
            }}
          ></Button>
        </Tooltip>
      </div>
    </div>
  );
}
