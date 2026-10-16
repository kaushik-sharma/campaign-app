import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ReportBody } from '@/components/report/report-body';
import { Screen } from '@/components/ui/screen';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { useReport } from '@/features/reports/queries';
import { layout, radius, space } from '@/theme';

/** A campaign's delivery report: where the money went, reach and per-channel delivery. */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useReport(id);
  return (
    <Screen title="Report" back>
      {query.data ? (
        <ReportBody report={query.data} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : (
        <SkeletonGroup style={styles.skeleton} label="Loading report">
          <Skeleton height={120} radius={radius.lg} />
          <Skeleton height={220} radius={radius.lg} />
        </SkeletonGroup>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeleton: { paddingHorizontal: layout.gutter, gap: space.lg },
});
