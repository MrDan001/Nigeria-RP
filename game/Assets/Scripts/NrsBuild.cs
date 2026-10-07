#if UNITY_EDITOR
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

public static class NrsBuild
{
    public static void BuildAndroid()
    {
        const string outputDirectory = "build/Android";
        const string outputPath = outputDirectory + "/NRS-Phase1.apk";

        Directory.CreateDirectory(outputDirectory);

        PlayerSettings.companyName = "Nigerian Roleplay Simulator";
        PlayerSettings.productName = "Nigerian Roleplay Simulator";
        PlayerSettings.applicationIdentifier = "com.nrs.nigerianroleplay";
        PlayerSettings.bundleVersion = "0.1.0";
        PlayerSettings.Android.bundleVersionCode = 1;

        var scenes = EditorBuildSettings.scenes
            .Where(scene => scene.enabled)
            .Select(scene => scene.path)
            .ToArray();

        if (scenes.Length == 0)
        {
            throw new BuildFailedException("No enabled scenes were found in EditorBuildSettings.");
        }

        var options = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = outputPath,
            target = BuildTarget.Android,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(options);

        if (report.summary.result != BuildResult.Succeeded)
        {
            throw new BuildFailedException(
                $"Android build failed with result {report.summary.result}. Errors: {report.summary.totalErrors}"
            );
        }

        Debug.Log($"NRS Android APK created at: {outputPath}");
    }
}
#endif
