import { SwipeContainer } from "@/components/SwipeContainer";
import { CurrentRateScreen } from "@/components/CurrentRateScreen";
import { ChartScreen } from "@/components/ChartScreen";
import { AnalysisScreen } from "@/components/AnalysisScreen";
import { WakeLockControl } from "@/components/WakeLockControl";

export default function Home() {
  return (
    <>
      <WakeLockControl />
      <SwipeContainer>
        <CurrentRateScreen />
        <ChartScreen />
        <AnalysisScreen />
      </SwipeContainer>
    </>
  );
}
