import React from 'react';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';

// Simple bar chart with a goal line. data: [{ value, label }].
export default function BarChart({ data, goal = 0, color = colors.amber, width = 320, height = 170 }) {
  const padTop = 12;
  const padBottom = 22;
  const chartH = height - padTop - padBottom;
  const n = Math.max(data.length, 1);
  const max = Math.max(goal, ...data.map((d) => d.value), 1) * 1.15;
  const slot = width / n;
  const barW = slot * 0.58;
  const goalY = padTop + chartH - (goal / max) * chartH;

  return (
    <Svg width={width} height={height}>
      {/* goal line */}
      {goal > 0 ? (
        <>
          <Line x1={0} y1={goalY} x2={width} y2={goalY} stroke={colors.textFaint} strokeWidth={1} strokeDasharray="4 4" />
          <SvgText x={width - 2} y={goalY - 4} fill={colors.textDim} fontSize={10} fontFamily={fonts.bold} textAnchor="end">
            יעד
          </SvgText>
        </>
      ) : null}

      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * chartH, d.value > 0 ? 3 : 0);
        const x = i * slot + (slot - barW) / 2;
        const y = padTop + chartH - barH;
        const hit = goal > 0 && d.value >= goal;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={d.value === 0 ? colors.surface3 : color}
              opacity={d.value === 0 ? 1 : hit ? 1 : 0.5}
            />
            <SvgText
              x={x + barW / 2}
              y={height - 7}
              fill={colors.textFaint}
              fontSize={9}
              fontFamily={fonts.medium}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
