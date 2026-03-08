import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Nfc } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

export function TodayEmployeeAttendanceCard({
  statusKey,
  dateLabel,
  showSmartPass = false,
}: {
  statusKey: "P" | "A" | "L" | "H" | "O" | "M";
  dateLabel: string;
  showSmartPass: boolean
}) {
  const { colors } = useTheme();

  const statusMap: any = {
    P: {
      label: "Present",
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      note: "Marked present by management",
    },
    A: {
      label: "Absent",
      bg: colors.statusAbg,
      text: colors.statusAtext,
      border: colors.statusAborder,
      note: "Marked absent by management",
    },
    L: {
      label: "On Leave",
      bg: colors.statusLbg,
      text: colors.statusLtext,
      border: colors.statusLborder,
      note: "Approved leave for today",
    },
    H: {
      label: "Half Day",
      bg: colors.statusHbg,
      text: colors.statusHtext,
      border: colors.statusHborder,
      note: "Half day attendance recorded",
    },
    O: {
      label: "Over Time",
      bg: colors.statusObg,
      text: colors.statusOtext,
      border: colors.statusOborder,
      note: "Overtime recorded for today",
    },
    M: {
      label: "Not Marked",
      bg: colors.warningSoft,
      text: colors.warning,
      border: colors.border,
      note: "Attendance not marked yet",
    },
  };

  const status = statusMap[statusKey];
  const router = useRouter();

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
          <InfoRow label="Marked By" value={statusKey != 'M' ? "Management" : '-'} />
          <InfoRow label="Remark" value={status.note} />
        </View>

        {(statusKey === 'M' && showSmartPass) && (
          <TouchableOpacity
            onPress={() => router.push('/(employee)/mark-attendance')}
            activeOpacity={0.8}
            className="mt-4 flex-row items-center justify-center gap-2 py-3 rounded-xl border"
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
              borderStyle: 'dashed'
            }}
          >
            <Nfc size={18} color={colors.primary} />
            <AppText bold primary>SmartPass: Tap to Mark</AppText>
          </TouchableOpacity>
        )}
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
