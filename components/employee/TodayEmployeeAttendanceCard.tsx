import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/context/ThemeContext";
import { View } from "react-native";

export function TodayEmployeeAttendanceCard({
  statusKey,
  dateLabel,
}: {
  statusKey: "p" | "a" | "l" | "h" | "o" | "m";
  dateLabel: string;
}) {
  const { colors } = useTheme();

  const statusMap: any = {
    p: {
      label: "Present",
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      note: "Marked present by management",
    },
    a: {
      label: "Absent",
      bg: colors.statusAbg,
      text: colors.statusAtext,
      border: colors.statusAborder,
      note: "Marked absent by management",
    },
    l: {
      label: "On Leave",
      bg: colors.statusLbg,
      text: colors.statusLtext,
      border: colors.statusLborder,
      note: "Approved leave for today",
    },
    h: {
      label: "Half Day",
      bg: colors.statusHbg,
      text: colors.statusHtext,
      border: colors.statusHborder,
      note: "Half day attendance recorded",
    },
    o: {
      label: "Over Time",
      bg: colors.statusObg,
      text: colors.statusOtext,
      border: colors.statusOborder,
      note: "Overtime recorded for today",
    },
    m: {
      label: "Not Marked",
      bg: colors.warningSoft,
      text: colors.warning,
      border: colors.border,
      note: "Attendance not marked yet",
    },
  };

  const status = statusMap[statusKey];

  return (
    <View className="mt-6">
      <View
        className="rounded-2xl px-5 py-5"
        style={{
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: status.border,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <AppText size="label">
              Today’s Attendance
            </AppText>
            <AppText size="min" muted>
              {dateLabel}
            </AppText>
          </View>
          <View
            className="px-4 py-1.5 rounded-full"
            style={{ backgroundColor: status.bg }}
          >
            <AppText size="subtext" bold style={{ color: status.text }}>
              {status.label}
            </AppText>
          </View>
        </View>
        <View
          className="my-4"
          style={{
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.6,
          }}
        />
        <View className="gap-2">
          <InfoRow label="Status" value={status.label} />
          <InfoRow label="Marked By" value={statusKey != 'm' ? "Management" : '-'} />
          <InfoRow label="Remark" value={status.note} />
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <AppText size="subtext" muted semibold>
        {label}
      </AppText>
      <AppText size="subtext" semibold className="text-right max-w-[65%]">
        {value}
      </AppText>
    </View>
  );
}
