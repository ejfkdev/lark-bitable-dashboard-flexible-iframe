"use client";

import FlexibleIframe from "./FlexibleIframe";
import { dashboard, DashboardState } from "@lark-base-open/js-sdk";
import { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Form,
  Row,
  Timeline,
  Typography,
} from "@douyinfe/semi-ui";
import FlexibleIframeConf from "./FlexibleIframeConf";
import { IconTreeTriangleDown } from "@douyinfe/semi-icons";
import classNames from "classnames";
import { useMemoizedFn, useReactive, useThrottleFn } from "ahooks";
import { shuffle } from "es-toolkit/array";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [isConfig, setIsConfig] = useState(false);
  const formRef = useRef<Form>(null);
  const [webBaseHeight, setWebBaseHeight] = useState(1440);
  // const { t } = useTranslation();
  const config = useReactive<ICustomConfig>({
    url: "",
    webWidth: 1440,
    webHeight: 1440,
    left: 0,
    top: 0,
    width: 1440,
    height: 1440,
    fit: "contain",
    view: true,
    clickable: true,
    refresh: true,
    interval: 10,
    intervalUnit: 60 * 1000,
  });

  const setConfig = (c: ICustomConfig) => {
    config.fit = c.fit;
    config.height = c.height;
    config.left = c.left;
    config.top = c.top;
    config.url = c.url;
    config.view = c.view;
    config.webWidth = c.webWidth;
    config.webHeight = c.webHeight;
    config.width = c.width;
    config.clickable = c.clickable;
    config.refresh = c.refresh;
    config.interval = c.interval;
    config.intervalUnit = c.intervalUnit;
  };

  useEffect(() => {
    const isCreate = dashboard.state === DashboardState.Create;
    setIsCreate(isCreate);
    const isConfig = dashboard.state === DashboardState.Config || isCreate;
    setIsConfig(isConfig);
    // setIsCreate(true);
    // setIsConfig(true);
    if (!isCreate) {
      dashboard
        .getConfig()
        .then(updateConfig)
        .then(() => setReady(true));
    } else {
      formRef.current?.formApi.setValues(config);
      setReady(true);
    }
    const offConfigChange = dashboard.onConfigChange((r) => {
      // 监听配置变化，协同修改配置
      updateConfig({
        ...r.data,
      });
    });

    return () => {
      offConfigChange();
    };
  }, []);

  useEffect(() => {
    if (isCreate && formRef.current) {
      formRef.current?.formApi.setValues(config);
      setReady(true);
    }
  }, [isConfig]);

  const updateConfig = (res: any) => {
    const { customConfig } = res;
    if (customConfig) {
      setConfig(customConfig);
      formRef.current?.formApi.setValues(customConfig);
    }
  };

  useEffect(() => {
    if (config.view === undefined) config.view = true;
    if (config.width > config.webWidth) config.width = config.webWidth;
    console.log(`useEffect config`, config);
    formRef.current?.formApi.setValues(config);
  }, [
    config.url,
    config.webWidth,
    config.webHeight,
    config.left,
    config.top,
    config.width,
    config.height,
    config.fit,
    config.view,
    config.clickable,
    config.refresh,
    config.interval,
    config.intervalUnit,
  ]);

  const onClick = useMemoizedFn(() => {
    console.log(`save config`, { ...config });
    // 保存配置
    dashboard.saveConfig({
      customConfig: JSON.parse(JSON.stringify({ ...config, view: true })),
      dataConditions: [],
    } as any);
  });

  const setWebWidth = (width: number) => {
    formRef.current?.formApi.setValue("webWidth", width);
  };

  const { run: showDemo } = useThrottleFn(
    () => {
      const conf = demos[lastIndex++ % demos.length];
      setWebBaseHeight(conf.webHeight);
      setConfig({
        ...conf,
        view: true,
      });
    },
    { wait: 300 }
  );

  useEffect(() => {
    console.log(
      `webBaseHeight`,
      `webBaseHeight`,
      webBaseHeight,
      `to`,
      `config.webHeight`,
      config.webHeight
    );
    config.webHeight = webBaseHeight;
    // 选择框不超过网页高度
    if (config.height > config.webHeight - config.top) {
      config.height = config.webHeight - config.top;
    }
  }, [webBaseHeight]);

  useEffect(() => {
    console.log(
      `dashboard useEffect top`,
      `webBaseHeight`,
      webBaseHeight,
      `config.top`,
      config.top,
      `config.height`,
      config.height,
      `newH`,
      webBaseHeight + config.top + config.height
    );
    if (config.top + config.height > config.webHeight) {
      config.webHeight = config.top + config.height;
      updateWebBaseHeight();
    }
  }, [config.top]);

  const updateWebBaseHeight = () => {
    setWebBaseHeight(config.webHeight);
  };

  return (
    <div className="main">
      <main
        className={`flex content ${classNames({
          "gap-8": isConfig,
          "m-16": isConfig,
        })}`}
      >
        {/* 展示模式 */}
        {ready && config.view && !isConfig && (
          <FlexibleIframe config={config}></FlexibleIframe>
        )}
        {/* 配置模式 */}
        {ready && isConfig && (
          <FlexibleIframeConf
            config={config}
            updateWebBaseHeight={updateWebBaseHeight}
          ></FlexibleIframeConf>
        )}
        {/* 配置模式 + 预览 */}
        {ready && config.view && isConfig && (
          <div className="flex-1 border-2 border-gray-300 shadow-xl rounded-2xl w-full h-full overflow-hidden">
            <FlexibleIframe
              config={config}
              isConfig={isConfig}
            ></FlexibleIframe>
          </div>
        )}
      </main>
      {isConfig && (
        <aside className="config-panel">
          <Form
            className="form"
            initValues={config}
            ref={formRef}
            onValueChange={setConfig}
            disabled={config.url === ""}
          >
            <Timeline>
              {/* 只在创建模式显示示例按钮 */}
              {isCreate && (
                <Timeline.Item>
                  <Button theme="outline" type="secondary" onClick={showDemo}>
                    随机展示一个例子
                  </Button>
                  <div className="h-8"></div>
                </Timeline.Item>
              )}
              <Timeline.Item
                dot={
                  <Avatar color="blue" size="small">
                    1
                  </Avatar>
                }
              >
                <Typography.Text style={{ fontSize: "1.25rem" }}>
                  添加网页
                </Typography.Text>
                <Form.Input
                  field="url"
                  label="网址"
                  disabled={false}
                  className="w-full"
                  size="large"
                  addonBefore={
                    <span className="w-8 text-2xl text-semi-color-text-2 icon-[hugeicons--link-04]"></span>
                  }
                />
              </Timeline.Item>
              <Timeline.Item
                dot={
                  <Avatar color="blue" size="small">
                    2
                  </Avatar>
                }
              >
                <Typography.Text style={{ fontSize: "1.25rem" }}>
                  选择区域
                </Typography.Text>
                <br />
                <br />
                <Typography.Text>
                  拖动左侧的选择框，设置要展示的网页区域
                </Typography.Text>
                <Form.InputNumber
                  field="webWidth"
                  label="网页宽度"
                  size="large"
                  shiftStep={50}
                  hideButtons
                  addonBefore={
                    <span className="icon-[fluent--arrow-autofit-width-dotted-24-regular] w-8 text-2xl text-semi-color-text-2"></span>
                  }
                  addonAfter={
                    <Dropdown
                      clickToHide
                      position={"bottomRight"}
                      render={
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setWebWidth(320)}>
                            320px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(480)}>
                            480px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(640)}>
                            640px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(720)}>
                            720px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1024)}>
                            1024px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1280)}>
                            1280px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1366)}>
                            1366px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1440)}>
                            1440px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1600)}>
                            1600px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(1920)}>
                            1920px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(2560)}>
                            2560px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebWidth(3200)}>
                            3200px
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      }
                    >
                      <Button icon={<IconTreeTriangleDown />}></Button>
                    </Dropdown>
                  }
                />
                <Form.InputNumber
                  className="w-full"
                  field="webHeight"
                  label="网页高度"
                  shiftStep={50}
                  size="large"
                  hideButtons
                  addonBefore={
                    <span className="icon-[fluent--arrow-autofit-height-dotted-24-regular] w-8 text-2xl text-semi-color-text-2"></span>
                  }
                  onNumberChange={(value) => setWebBaseHeight(value)}
                  addonAfter={
                    <Dropdown
                      clickToHide
                      position={"bottomRight"}
                      render={
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setWebBaseHeight(320)}>
                            320px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(480)}>
                            480px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(640)}>
                            640px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(720)}>
                            720px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(1440)}>
                            1440px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(2560)}>
                            2400px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(4000)}>
                            4000px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(6000)}>
                            6000px
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setWebBaseHeight(8000)}>
                            8000px
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => setWebBaseHeight(10000)}
                          >
                            10000px
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      }
                    >
                      <Button icon={<IconTreeTriangleDown />}></Button>
                    </Dropdown>
                  }
                />
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.InputNumber
                      field="left"
                      label="左边距"
                      shiftStep={25}
                      size="large"
                      suffix={"px"}
                      innerButtons={true}
                      prefix={
                        <span className="icon-[mynaui--panel-left] w-8 text-2xl text-semi-color-text-2"></span>
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Form.InputNumber
                      field="top"
                      label="上边距"
                      shiftStep={25}
                      size="large"
                      suffix={"px"}
                      innerButtons={true}
                      prefix={
                        <span className="icon-[mynaui--panel-top] w-8 text-2xl text-semi-color-text-2"></span>
                      }
                    />
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.InputNumber
                      field="width"
                      label="宽度"
                      shiftStep={25}
                      size="large"
                      suffix={"px"}
                      innerButtons={true}
                      prefix={
                        <span className="icon-[carbon--fit-to-width] w-8 text-2xl text-semi-color-text-2"></span>
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Form.InputNumber
                      field="height"
                      label="高度"
                      shiftStep={25}
                      size="large"
                      suffix={"px"}
                      innerButtons={true}
                      prefix={
                        <span className="icon-[carbon--fit-to-height] w-8 text-2xl text-semi-color-text-2"></span>
                      }
                    />
                  </Col>
                </Row>
              </Timeline.Item>
              <Timeline.Item
                dot={
                  <Avatar color="blue" size="small">
                    3
                  </Avatar>
                }
              >
                <Typography.Text style={{ fontSize: "1.25rem" }}>
                  展示配置
                </Typography.Text>
                <Row>
                  <Col span={12}>
                    <Form.Switch field="clickable" label="允许点击网页" />
                  </Col>
                  <Col span={12}>
                    <Form.Switch field="view" label="实时预览" />
                  </Col>
                </Row>
                <Form.RadioGroup
                  className="gap-0 w-full"
                  disabled={!config.view}
                  field="fit"
                  type="card"
                  direction="vertical"
                  label={"选择展示效果"}
                  style={{
                    gap: 0,
                  }}
                >
                  <Form.Radio
                    value="static"
                    disabled={config.url === ""}
                    extra="保持网页原始大小，可能会显示不全"
                  >
                    原始大小
                  </Form.Radio>
                  <Form.Radio
                    value="contain"
                    disabled={config.url === ""}
                    extra="宽高自适应，缩放到插件面板大小"
                  >
                    完整显示
                  </Form.Radio>
                  <Form.Radio
                    value="cover"
                    disabled={config.url === ""}
                    extra="始终放大，填满整个仪表盘插件面板"
                  >
                    填满面板
                  </Form.Radio>
                </Form.RadioGroup>
                <Row>
                  <Col span={12}>
                    <Form.Switch field="refresh" label="定时刷新" />
                  </Col>
                  <Col span={12}>
                    <Form.RadioGroup
                      field="intervalUnit"
                      label="时间单位"
                      type="button"
                      defaultValue={60 * 1000}
                    >
                      <Form.Radio value={60 * 1000}>分钟</Form.Radio>
                      <Form.Radio value={1 * 1000}>秒</Form.Radio>
                    </Form.RadioGroup>
                  </Col>
                </Row>
                <Form.Slider
                  field="interval"
                  label="刷新间隔"
                  min={1}
                  max={60}
                  marks={{
                    1: " 1",
                    5: "5",
                    10: "10",
                    15: "15",
                    20: "20",
                    30: "30",
                    45: "45",
                    60: "60",
                  }}
                  defaultValue={10}
                  tipFormatter={(v) =>
                    `${v} ${config.intervalUnit === 60 * 1000 ? "分钟" : "秒"}`
                  }
                  handleDot={{ size: "4px", color: "blue" }}
                ></Form.Slider>
              </Timeline.Item>
              <Timeline.Item>
                <Typography.Text
                  icon={<span className="icon-doc"></span>}
                  underline
                  link={{
                    target: "_blank",
                    href: "https://ejfk-dev.feishu.cn/wiki/RiMAwdhyRiwqPDkJntRcIqKrnhh",
                  }}
                >
                  使用说明
                </Typography.Text>
              </Timeline.Item>
            </Timeline>
          </Form>
          <Button
            className="btn"
            theme="solid"
            type="primary"
            htmlType="submit"
            onClick={onClick}
          >
            确定
          </Button>
        </aside>
      )}
    </div>
  );
}

// 网页小组件例子
const demos: ICustomConfig[] = shuffle([
  {
    url: "https://top.baidu.com/board",
    webWidth: 1440,
    webHeight: 1440,
    left: 185,
    top: 170,
    width: 400,
    height: 500,
    fit: "contain",
    refresh: true,
    interval: 10,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://weather.cma.cn",
    webWidth: 1440,
    webHeight: 1440,
    left: 140,
    top: 180,
    width: 1160,
    height: 280,
    fit: "contain",
    refresh: true,
    interval: 10,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://gushitong.baidu.com/index/ab-000001",
    webWidth: 1440,
    webHeight: 1440,
    left: 120,
    top: 220,
    width: 390,
    height: 150,
    fit: "contain",
    refresh: true,
    interval: 30,
    intervalUnit: 1 * 1000,
    clickable: false,
  },
  {
    url: "https://hao.360.com/rili/",
    webWidth: 1440,
    webHeight: 1440,
    left: 922,
    top: 218,
    width: 300,
    height: 475,
    fit: "contain",
    refresh: true,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://notion-widgets.rylan.cn/",
    webWidth: 1440,
    webHeight: 1440,
    left: 355,
    top: 180,
    width: 270,
    height: 480,
    fit: "contain",
    refresh: true,
    interval: 30,
    intervalUnit: 1 * 1000,
    clickable: false,
  },
  {
    url: "https://www.feishu.cn/product/base",
    webWidth: 1440,
    webHeight: 1440,
    left: 365,
    top: 190,
    width: 720,
    height: 165,
    fit: "contain",
    refresh: false,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: true,
  },
  {
    url: "https://www.feishu.cn/community/articles/base",
    webWidth: 1440,
    webHeight: 1440,
    left: 970,
    top: 500,
    width: 240,
    height: 430,
    fit: "contain",
    refresh: false,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: true,
  },
  {
    url: "https://www.feishu.cn/service",
    webWidth: 1440,
    webHeight: 3000,
    left: 70,
    top: 2255,
    width: 1300,
    height: 455,
    fit: "contain",
    refresh: false,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: true,
  },
  {
    url: "https://dynamicwallpaper.club/wallpaper/br31l421g1d",
    webWidth: 1440,
    webHeight: 1440,
    left: 140,
    top: 115,
    width: 1160,
    height: 655,
    fit: "cover",
    refresh: false,
    interval: 10,
    intervalUnit: 60 * 1000,
    clickable: true,
  },
  {
    url: "https://bizhi.360.cn/#/",
    webWidth: 768,
    webHeight: 1465,
    left: 10,
    top: 1030,
    width: 745,
    height: 425,
    fit: "cover",
    refresh: true,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://tool.fiaox.com/clock/",
    webWidth: 1440,
    webHeight: 1440,
    left: 755,
    top: 280,
    width: 235,
    height: 210,
    fit: "static",
    refresh: false,
    interval: 5,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://www.lddgo.net/common/digital-clock",
    webWidth: 1440,
    webHeight: 1440,
    left: 485,
    top: 285,
    width: 475,
    height: 115,
    fit: "static",
    refresh: false,
    interval: 10,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://m.weibo.cn/u/7886214082?luicode=10000011&lfid=231583",
    webWidth: 320,
    webHeight: 320,
    left: 70,
    top: 25,
    width: 180,
    height: 180,
    fit: "static",
    refresh: true,
    interval: 60,
    intervalUnit: 60 * 1000,
    clickable: false,
  },
  {
    url: "https://toolwa.com/jizhi/",
    webWidth: 480,
    webHeight: 450,
    left: 0,
    top: 0,
    width: 480,
    height: 250,
    fit: "contain",
    refresh: true,
    interval: 15,
    intervalUnit: 1000,
    clickable: false,
  },
  {
    url: "https://piano.starrynets.com/",
    webWidth: 1280,
    webHeight: 500,
    left: 80,
    top: 220,
    width: 1120,
    height: 220,
    fit: "contain",
    clickable: true,
    refresh: false,
    interval: 10,
    intervalUnit: 60 * 1000,
  },
  {
    url: "https://www.shuxuele.com/time-clocks-analog-digital.html",
    webWidth: 480,
    webHeight: 1440,
    left: 120,
    top: 405,
    width: 240,
    height: 365,
    fit: "contain",
    clickable: false,
    refresh: false,
    interval: 10,
    intervalUnit: 60 * 1000,
  },
]);
let lastIndex = 0;
