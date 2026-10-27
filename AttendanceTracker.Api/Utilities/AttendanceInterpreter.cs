namespace AttendanceTracker.Api.Utilities;

public static class AttendanceInterpreter
{
    public static string GetStatus(
        string? timeIn,
        string? timeOut,
        string? late)
    {
        var cleanTimeIn =
            Clean(timeIn);

        var cleanTimeOut =
            Clean(timeOut);

        var cleanLate =
            Clean(late);

        if (IsSunday(cleanTimeIn))
        {
            return AttendanceStatus.Sunday;
        }

        if (IsAbsent(cleanTimeIn))
        {
            return AttendanceStatus.Absent;
        }

        if (
            string.IsNullOrWhiteSpace(cleanTimeIn)
            &&
            !string.IsNullOrWhiteSpace(cleanTimeOut)
        )
        {
            return AttendanceStatus.MissingCheckIn;
        }

        if (
            HasValidTimeIn(cleanTimeIn)
            &&
            string.IsNullOrWhiteSpace(cleanTimeOut)
        )
        {
            return AttendanceStatus.MissingCheckOut;
        }

        if (IsLate(cleanLate))
        {
            return AttendanceStatus.Late;
        }

        if (HasValidTimeIn(cleanTimeIn))
        {
            return AttendanceStatus.Present;
        }

        return AttendanceStatus.NoRecord;
    }

    public static bool HasValidTimeIn(
        string? timeIn)
    {
        var value =
            Clean(timeIn);

        return
            !string.IsNullOrWhiteSpace(value)
            &&
            !IsAbsent(value)
            &&
            !IsSunday(value);
    }

    public static bool IsAbsent(
        string? timeIn)
    {
        return string.Equals(
            Clean(timeIn),
            "AB",
            StringComparison.OrdinalIgnoreCase
        );
    }

    public static bool IsSunday(
        string? timeIn)
    {
        return string.Equals(
            Clean(timeIn),
            "Sunday",
            StringComparison.OrdinalIgnoreCase
        );
    }

    public static bool IsLate(
        string? late)
    {
        var value =
            Clean(late);

        return
            !string.IsNullOrWhiteSpace(value)
            &&
            value != "0"
            &&
            value != "00:00"
            &&
            value != "0:00";
    }

    public static bool HasMissingCheckIn(
        string? timeIn,
        string? timeOut)
    {
        return
            string.IsNullOrWhiteSpace(
                Clean(timeIn)
            )
            &&
            !string.IsNullOrWhiteSpace(
                Clean(timeOut)
            );
    }

    public static bool HasMissingCheckOut(
        string? timeIn,
        string? timeOut)
    {
        return
            HasValidTimeIn(timeIn)
            &&
            string.IsNullOrWhiteSpace(
                Clean(timeOut)
            );
    }

    public static int ParseMinutes(
        string? value)
    {
        var cleaned =
            Clean(value);

        if (
            string.IsNullOrWhiteSpace(cleaned)
            ||
            cleaned == "0"
        )
        {
            return 0;
        }

        if (
            TimeSpan.TryParse(
                cleaned,
                out var duration
            )
        )
        {
            return
                (int)duration.TotalMinutes;
        }

        return 0;
    }

    public static string FormatMinutes(
        int minutes)
    {
        if (minutes < 0)
        {
            minutes = 0;
        }

        var hours =
            minutes / 60;

        var remainingMinutes =
            minutes % 60;

        return
            $"{hours}:{remainingMinutes:D2}";
    }

    public static string? Clean(
        string? value)
    {
        if (
            string.IsNullOrWhiteSpace(value)
        )
        {
            return null;
        }

        return value.Trim();
    }
}