#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface YAHTNativeReminderStorage : NSObject

+ (nullable NSString *)stringForStorageId:(NSString *)storageId key:(NSString *)key;
+ (BOOL)setString:(NSString *)value storageId:(NSString *)storageId key:(NSString *)key;
+ (void)removeValueForStorageId:(NSString *)storageId key:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
